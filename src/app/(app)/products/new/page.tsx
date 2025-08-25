import { ProductForm } from './_components/product-form';

export default function NewProductPage() {
  return (
    <div className="flex flex-col items-center justify-start w-full">
        <div className="w-full text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Cadastro de Produto</h1>
        </div>
        <div className="w-full max-w-2xl">
            <ProductForm />
        </div>
    </div>
  );
}
