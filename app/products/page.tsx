import React from 'react';
import { getAllProducts, getAllCategories } from '@/lib/db';
import productsData from '@/data/import/products.json';
import categoriesData from '@/data/import/categories.json';
import ProductsCatalogueClient from '@/components/ProductsCatalogueClient';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  let initialProducts: Product[] = productsData as unknown as Product[];
  let initialCategories: any[] = categoriesData;

  try {
    const [dbProducts, dbCategories] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
    ]);
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      initialProducts = dbProducts;
    }
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      initialCategories = dbCategories;
    }
  } catch {
    // Fallback to static seed JSON if DB is unreachable
  }

  return (
    <ProductsCatalogueClient
      initialProducts={initialProducts}
      initialCategories={initialCategories}
    />
  );
}
