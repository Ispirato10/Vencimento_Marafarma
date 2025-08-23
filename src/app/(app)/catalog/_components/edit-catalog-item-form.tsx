
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import type { CatalogItem } from '@/types';

const catalogItemFormSchema = z.object({
  code: z.string(),
  name: z.string().min(1, 'Nome é obrigatório.'),
  category: z.string().optional(),
});

type CatalogItemFormValues = z.infer<typeof catalogItemFormSchema>;

interface EditCatalogItemFormProps {
  item: CatalogItem;
  onSave: (data: CatalogItem) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function EditCatalogItemForm({ item, onSave, onCancel, isSaving }: EditCatalogItemFormProps) {

  const form = useForm<CatalogItemFormValues>({
    resolver: zodResolver(catalogItemFormSchema),
    defaultValues: {
      ...item,
      category: item.category || '',
    },
  });

  const onSubmit = (data: CatalogItemFormValues) => {
    onSave({ ...item, ...data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                <Input {...field} readOnly disabled className="bg-muted/50" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
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
