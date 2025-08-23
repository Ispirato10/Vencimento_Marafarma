import { ProductForm } from './_components/product-form';

export default function NewProductPage() {
  return (
    <div className="flex justify-center items-start py-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Cadastro de Produto</h1>
        <ProductForm />
      </div>
    </div>
  );
}
