import {
  AdminApiClient,
  ClientResponse,
  createAdminApiClient,
} from '@shopify/admin-api-client';
import {marked} from 'marked';
import {Product} from './products';
import {BinaryFile, binaryToFile} from './image-compression';
import {env} from '../env';

const handleErrors = (errors: ClientResponse['errors']) => {
  if (errors) {
    if (errors.graphQLErrors) {
      console.error(errors.graphQLErrors);
      throw new Error(
        errors.graphQLErrors.map(error => error.message).join(', '),
      );
    }
    console.error(errors);
    throw new Error(
      (errors.message || '') + (errors.response?.statusText || ''),
    );
  }
};

/**
 * Converts markdown to Shopify-compatible HTML
 * Sanitizes output to ensure compatibility with Shopify's HTML requirements
 */
export const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  marked.setOptions({breaks: true, gfm: true});

  let html = marked(markdown) as string;

  html = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s(on\w+)="[^"]*"/gi, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return html;
};

const getClient = (() => {
  let client: AdminApiClient | null = null;

  return () => {
    if (client) return client;

    client = createAdminApiClient({
      storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
      apiVersion: '2024-10',
    });
    return client;
  };
})();

const getPrimaryLocation = (() => {
  let locationId: string | null = null;

  return async () => {
    if (locationId) return locationId;

    const query = `
    query {
      locations(first: 1) {
        edges {
          node {
            id
            name
            isPrimary
          }
        }
      }
    }
  `;
    const res = await getClient().request(query);
    handleErrors(res.errors);

    locationId = res.data?.locations?.edges?.[0]?.node?.id;

    if (!locationId) throw new Error('No primary location found');
    return locationId;
  };
})();

const createStagedUpload = async (file: BinaryFile, filename: string) => {
  const stagedUploadMutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const stagedUploadVariables = {
    input: [
      {
        filename: filename,
        mimeType: file.type,
        httpMethod: 'POST',
        resource: 'FILE',
      },
    ],
  };

  const res = await getClient().request(stagedUploadMutation, {
    variables: stagedUploadVariables,
  });
  handleErrors(res.errors);

  const stagedTarget = res.data?.stagedUploadsCreate?.stagedTargets?.[0];

  if (!stagedTarget) {
    throw new Error('Failed to get staged upload URL');
  }
  return stagedTarget;
};

const uploadToStagedUrl = async (
  stagedTarget: {url: string; parameters: {name: string; value: string}[]},
  file: BinaryFile,
) => {
  const formData = new FormData();

  stagedTarget.parameters.forEach((param: {name: string; value: string}) => {
    formData.append(param.name, param.value);
  });
  const fileObject = binaryToFile(file);
  formData.append('file', fileObject);

  const uploadResponse = await fetch(stagedTarget.url, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to staged URL');
  }
  console.log('File uploaded successfully to staged URL');
};

const uploadImageFile = async (file: BinaryFile, filename: string) => {
  console.log('Uploading image:', filename);

  // Step 1: Get staged upload URL
  const stagedTarget = await createStagedUpload(file, filename);

  // Step 2: Upload to staged URL
  await uploadToStagedUrl(stagedTarget, file);

  console.log('Successfully uploaded image:', filename);
  return stagedTarget.resourceUrl;
};

const attachImageToProduct = async (productId: string, resourceUrl: string) => {
  const mutation = `
    mutation productUpdate($product: ProductUpdateInput!, $media: [CreateMediaInput!]!) {
      productUpdate(product: $product, media: $media) {
        product {
          id
          media(first: 10) {
            nodes {
              id
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = {
    product: {id: productId},
    media: [{mediaContentType: 'IMAGE', originalSource: resourceUrl}],
  };
  console.log('Attaching image to product:', productId, resourceUrl);

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  return res.data?.productUpdate?.product?.media?.nodes?.[0];
};

const createSingleProduct = async (productData: Product) => {
  const mutation = `
    mutation productCreate($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    product: {
      title: productData.title,
      descriptionHtml: convertMarkdownToHtml(productData.description),
      category: 'gid://shopify/TaxonomyCategory/aa-1-4',
      status: 'ACTIVE',
    },
  };

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  if (res.data?.productCreate?.userErrors?.length > 0) {
    console.error(
      'Product creation errors:',
      res.data.productCreate.userErrors,
    );
    throw new Error(
      'Failed to create product: ' +
        res.data.productCreate.userErrors
          .map((e: {message: string}) => e.message)
          .join(', '),
    );
  }

  return res.data?.productCreate?.product;
};

let onlineStorePublicationId: string | null = null;

const getAllCollections = (() => {
  let collectionsCache: {id: string; title: string; handle: string}[] | null =
    null;

  return async () => {
    if (collectionsCache) return collectionsCache;

    const query = `
    query {
      collections(first: 50) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;
    const res = await getClient().request(query);
    handleErrors(res.errors);

    const collections =
      res.data?.collections?.edges?.map((edge: any) => edge.node) || [];

    collectionsCache = collections;
    return collections;
  };
})();

const findCollectionByCategory = async (category: string) => {
  const collections = await getAllCollections();
  const categoryLower = category.toLowerCase();

  // Direct matches
  const directMatch = collections.find(
    (collection: any) =>
      collection.title.toLowerCase() === categoryLower ||
      collection.handle.toLowerCase() === categoryLower,
  );

  if (directMatch) {
    return directMatch.id;
  }

  // Partial matches for common variations
  const partialMatch = collections.find((collection: any) => {
    const titleLower = collection.title.toLowerCase();
    const handleLower = collection.handle.toLowerCase();

    // Check if category contains collection name or vice versa
    return (
      titleLower.includes(categoryLower) ||
      categoryLower.includes(titleLower) ||
      handleLower.includes(categoryLower) ||
      categoryLower.includes(handleLower)
    );
  });
  return partialMatch?.id || null;
};

const addProductToCollection = async (productId: string, category: string) => {
  const collectionId = await findCollectionByCategory(category);

  if (!collectionId) {
    console.log(`No matching collection found for category "${category}"`);
  }
  const mutation = `
    mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {id: collectionId, productIds: [productId]};

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  if (res.data?.collectionAddProducts?.userErrors?.length > 0) {
    console.error(
      'Collection add product errors:',
      res.data.collectionAddProducts.userErrors,
    );
    throw new Error(
      'Failed to add product to collection: ' +
        res.data.collectionAddProducts.userErrors
          .map((e: {message: string}) => e.message)
          .join(', '),
    );
  }
  console.log('Product added to collection successfully');
  return res.data?.collectionAddProducts?.collection;
};

const getOnlineStorePublicationId = async () => {
  if (onlineStorePublicationId) {
    return onlineStorePublicationId;
  }

  const query = `
    query {
      publications(first: 10) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  const res = await getClient().request(query);
  handleErrors(res.errors);

  const publications = res.data?.publications?.edges;
  const onlineStore = publications?.find(
    (pub: any) => pub.node.name === 'Online Store',
  );

  if (!onlineStore) {
    throw new Error('Online Store publication not found');
  }
  onlineStorePublicationId = onlineStore.node.id;
  return onlineStorePublicationId;
};

const publishProductToOnlineStore = async (productId: string) => {
  const publicationId = await getOnlineStorePublicationId();

  const mutation = `
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationsCount {
            count
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = {id: productId, input: [{publicationId: publicationId}]};

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  if (res.data?.publishablePublish?.userErrors?.length > 0) {
    console.error(
      'Publication errors:',
      res.data.publishablePublish.userErrors,
    );
    throw new Error(
      'Failed to publish product: ' +
        res.data.publishablePublish.userErrors
          .map((e: {message: string}) => e.message)
          .join(', '),
    );
  }

  console.log('Product published to online store successfully');
  return res.data?.publishablePublish?.publishable;
};

const createProductOptions = async (productId: string) => {
  const mutation = `
    mutation productOptionsCreate($productId: ID!, $options: [OptionCreateInput!]!) {
      productOptionsCreate(productId: $productId, options: $options) {
        product {
          id
          options {
            id
            name
            optionValues {
              id
              name
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    productId,
    options: [
      {
        name: 'Title',
        values: [
          {
            name: 'Default Title',
          },
        ],
      },
    ],
  };

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  if (res.data?.productOptionsCreate?.userErrors?.length > 0) {
    console.error(
      'Product options creation errors:',
      res.data.productOptionsCreate.userErrors,
    );
    throw new Error(
      'Failed to create product options: ' +
        res.data.productOptionsCreate.userErrors
          .map((e: {message: string}) => e.message)
          .join(', '),
    );
  }

  return res.data?.productOptionsCreate?.product;
};

const updateProductVariant = async (productId: string, price: number) => {
  // First, get the existing variant that was created with the product options
  const getVariantsQuery = `
    query($productId: ID!) {
      product(id: $productId) {
        variants(first: 1) {
          nodes {
            id
            inventoryItem {
              id
              tracked
            }
          }
        }
      }
    }
  `;

  const getVariantsRes = await getClient().request(getVariantsQuery, {
    variables: {productId},
  });
  handleErrors(getVariantsRes.errors);

  const existingVariant = getVariantsRes.data?.product?.variants?.nodes?.[0];

  if (!existingVariant) {
    throw new Error('No existing variant found to update');
  }

  // Update the existing variant with price using the correct mutation
  const mutation = `
    mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          inventoryItem {
            id
            tracked
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    productId,
    variants: [
      {
        id: existingVariant.id,
        price: price.toString(),
        inventoryPolicy: 'DENY',
      },
    ],
  };

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  if (res.data?.productVariantsBulkUpdate?.userErrors?.length > 0) {
    console.error(
      'User errors:',
      res.data.productVariantsBulkUpdate.userErrors,
    );
    throw new Error(
      'Failed to update product variant: ' +
        res.data.productVariantsBulkUpdate.userErrors
          .map((e: {message: string}) => e.message)
          .join(', '),
    );
  }

  const variant = res.data?.productVariantsBulkUpdate?.productVariants?.[0];

  if (variant && variant.inventoryItem) {
    console.log(
      'Variant updated with inventory item:',
      variant.inventoryItem.id,
    );
    console.log(
      'Initial inventory tracking status:',
      variant.inventoryItem.tracked,
    );

    // Enable inventory tracking
    console.log('Enabling inventory tracking...');
    const updatedItem = await updateInventoryTracking(variant.inventoryItem.id);
    console.log('Tracking enabled result:', updatedItem);

    // Wait a moment for inventory tracking to be enabled
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set inventory level
    console.log('Setting inventory level to 1...');

    const locationId = await getPrimaryLocation();

    const adjustmentGroup = await setInventoryLevel(
      variant.inventoryItem.id,
      locationId,
      1,
    );
    console.log('Inventory level set result:', adjustmentGroup);

    // Verify final inventory status
    console.log('Final inventory item ID:', variant.inventoryItem.id);
    console.log('Location ID used:', locationId);
  }
  return variant;
};

const updateInventoryTracking = async (inventoryItemId: string) => {
  const mutation = `
    mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
      inventoryItemUpdate(id: $id, input: $input) {
        inventoryItem {
          id
          tracked
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = {id: inventoryItemId, input: {tracked: true}};

  console.log(
    'Updating inventory tracking with variables:',
    JSON.stringify(variables, null, 2),
  );
  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  console.log(
    'Inventory tracking update response:',
    JSON.stringify(res.data, null, 2),
  );
  const inventoryItem = res.data?.inventoryItemUpdate?.inventoryItem;
  console.log('Inventory tracking updated:', inventoryItem?.tracked);

  return inventoryItem;
};

const setInventoryLevel = async (
  inventoryItemId: string,
  locationId: string,
  quantity: number,
) => {
  const mutation = `
    mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      name: 'on_hand',
      reason: 'correction',
      referenceDocumentUri: 'inventory://initial_stock_setting',
      ignoreCompareQuantity: true,
      quantities: [
        {
          inventoryItemId: inventoryItemId,
          locationId: locationId,
          quantity: quantity,
        },
      ],
    },
  };

  const res = await getClient().request(mutation, {variables});
  handleErrors(res.errors);

  console.log(
    'Full inventory set response:',
    JSON.stringify(res.data, null, 2),
  );

  if (res.data?.inventorySetQuantities?.userErrors?.length > 0) {
    console.error(
      'Inventory set errors:',
      res.data.inventorySetQuantities.userErrors,
    );
    throw new Error(
      'Failed to set inventory quantity: ' +
        res.data.inventorySetQuantities.userErrors
          .map((e: {message: string}) => e.message)
          .join(', '),
    );
  }

  console.log(
    'Inventory quantity set successfully:',
    res.data?.inventorySetQuantities?.inventoryAdjustmentGroup,
  );
  return res.data?.inventorySetQuantities?.inventoryAdjustmentGroup;
};

const attachProductImages = async (product: Product, productId: string) => {
  const imagePromises = product.images.map(async (image, i) => {
    const filename = `${product.title.replace(/[^a-zA-Z0-9]/g, '_')}_${i + 1}.jpg`;
    const resourceUrl = await uploadImageFile(image, filename);

    return await attachImageToProduct(productId, resourceUrl);
  });
  return await Promise.all(imagePromises);
};

export const createProduct = async (product: Product) => {
  const createdProduct = await createSingleProduct(product);

  if (!createdProduct) {
    throw new Error('Product creation failed: ' + product.title);
  }
  const productId = createdProduct.id;

  await Promise.all([
    createProductOptions(productId),
    updateProductVariant(productId, product.price!),
    publishProductToOnlineStore(productId),
    addProductToCollection(productId, product.category),
    attachProductImages(product, productId),
  ]);
  return createdProduct;
};
