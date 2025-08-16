
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Product } from '@/types';

const productFormSchema = z.object({
  code: z.string(),
  name: z.string().min(1, 'Nome é obrigatório.'),
  quantity: z.coerce.number().min(0, 'Quantidade não pode ser negativa.'),
  category: z.string().optional(),
  batch: z.string().optional(),
  expirationDate: z.string().refine((val) => {
    const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
    return !isNaN(parsedDate.getTime()) && val.length === 10;
  }, {
    message: 'Data inválida. Use o formato dd/mm/aaaa.',
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface EditProductFormProps {
  product: Product;
  onSave: (data: Product) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function EditProductForm({ product, onSave, onCancel, isSaving }: EditProductFormProps) {

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...product,
      expirationDate: format(parseISO(product.expirationDate), 'dd/MM/yyyy'),
      batch: product.batch || '',
      category: product.category || '',
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    const parsedDate = parse(data.expirationDate, 'dd/MM/yyyy', new Date());
    onSave({ ...data, expirationDate: parsedDate.toISOString() });
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    if (value.length > 5) {
      value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
    }
    form.setValue('expirationDate', value, { shouldValidate: true });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome do Produto</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Dipirona 500mg" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Analgésico" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="batch"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Lote</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: A22B01" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Data de Validade</FormLabel>
                 <FormControl>
                      <Input 
                        placeholder="dd/mm/aaaa"
                        {...field} 
                        onChange={handleDateChange} 
                        maxLength={10}
                      />
                    </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
            </Button>
        </div>
      </form>
    </Form>
  );
}
