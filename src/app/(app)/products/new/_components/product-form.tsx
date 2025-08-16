
"use client";

import { useRef, useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DataContext } from '@/context/data-context';
import type { Product, CatalogItem } from '@/types';

const productFormSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório.'),
  name: z.string().min(1, 'Nome é obrigatório.'),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que 0.'),
  category: z.string(),
  batch: z.string(),
  expirationDate: z.date({
    required_error: 'Data de validade é obrigatória.',
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductForm() {
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
  const [isNewCatalogItem, setIsNewCatalogItem] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const { catalog, addProduct, addCatalogItem } = useContext(DataContext);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: '',
      name: '',
      quantity: 1,
      category: '',
      batch: '',
    },
  });

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  const handleCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const code = e.target.value;
    if (!code) return;

    setIsFetching(true);
    // Simulate API call, in a real app this would be a fetch to a server
    await new Promise((resolve) => setTimeout(resolve, 300));
    const catalogItem = catalog.find((item) => item.code === code);
    setIsFetching(false);

    if (catalogItem) {
      form.setValue('name', catalogItem.name, { shouldValidate: true });
      form.setValue('category', catalogItem.category, { shouldValidate: true });
      setIsNewCatalogItem(false);
      toast({
        title: 'Produto encontrado!',
        description: `Dados de "${catalogItem.name}" preenchidos.`,
      });
    } else {
       toast({
        variant: 'default',
        title: 'Produto não catalogado',
        description: 'Preencha o nome e a categoria manualmente.',
      });
      setIsNewCatalogItem(true);
    }
  };
  
  const onSubmit = (data: ProductFormValues) => {
    const newProduct: Product = { ...data, expirationDate: data.expirationDate.toISOString() };
    addProduct(newProduct);
    
    let toastDescription = `O produto "${data.name}" foi adicionado com sucesso.`;
    if (isNewCatalogItem) {
        const newCatalogItem: CatalogItem = { code: data.code, name: data.name, category: data.category };
        addCatalogItem(newCatalogItem);
        toastDescription += ' Este novo item foi adicionado ao seu catálogo.';
    }

    toast({
      title: 'Produto Salvo!',
      description: toastDescription,
      variant: 'accent',
    });
    form.reset();
    setIsNewCatalogItem(false);
    codeInputRef.current?.focus();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Item</CardTitle>
        <CardDescription>
          Preencha os campos abaixo para adicionar um novo produto ao estoque.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Digite ou escaneie o código"
                        {...field}
                        onBlur={handleCodeBlur}
                        ref={codeInputRef}
                      />
                      {isFetching && (
                        <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
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
                      <Input placeholder="Ex: Dipirona 500mg" {...field} readOnly={!isNewCatalogItem && form.getValues('name') !== ''} />
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
                      <Input placeholder="Ex: Analgésico" {...field} readOnly={!isNewCatalogItem && form.getValues('category') !== ''} />
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Produto
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
