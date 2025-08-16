
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  expirationDate: z.date({
    required_error: 'Data de validade é obrigatória.',
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
      expirationDate: parseISO(product.expirationDate),
      batch: product.batch || '',
      category: product.category || '',
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    onSave({ ...data, expirationDate: data.expirationDate.toISOString() });
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
                <FormItem className="flex flex-col pt-2">
                <FormLabel>Data de Validade</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={'outline'}
                        className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                        )}
                        >
                        {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                        ) : (
                            <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date < new Date(new Date().setHours(0,0,0,0))
                        }
                        initialFocus
                        locale={ptBR}
                    />
                    </PopoverContent>
                </Popover>
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
