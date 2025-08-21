
"use client";

import { useRef, useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { parse } from 'date-fns';
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
  category: z.string().optional(),
  batch: z.string().optional(),
  expirationDate: z.string().refine((val) => {
    try {
      if (val.length !== 10) return false;
      const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }, {
    message: 'Data inválida. Use o formato dd/mm/aaaa.',
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductForm() {
  const { toast } = useToast();
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewCatalogItem, setIsNewCatalogItem] = useState(false);
  const { catalog, addProduct, addCatalogItem } = useContext(DataContext);

  // Refs for focus management
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const expirationDateInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: '',
      name: '',
      quantity: 1,
      category: '',
      batch: '',
      expirationDate: '',
    },
  });

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  const handleCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const code = e.target.value;
    if (!code) return;

    setIsFetchingCatalog(true);
    // Simulate network delay for user feedback
    await new Promise((resolve) => setTimeout(resolve, 300));
    const catalogItem = catalog.find((item) => item.code === code);
    setIsFetchingCatalog(false);

    if (catalogItem) {
      form.setValue('name', catalogItem.name, { shouldValidate: true });
      form.setValue('category', catalogItem.category || '', { shouldValidate: true });
      setIsNewCatalogItem(false);
      toast({
        title: 'Produto encontrado!',
        description: `Dados de "${catalogItem.name}" preenchidos.`,
      });
      quantityInputRef.current?.focus();
    } else {
       toast({
        variant: 'default',
        title: 'Produto não catalogado',
        description: 'Preencha o nome e a categoria manualmente.',
      });
      setIsNewCatalogItem(true);
      nameInputRef.current?.focus();
    }
  };
  
  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    try {
      const parsedDate = parse(data.expirationDate, 'dd/MM/yyyy', new Date());
      
      const newProduct: Omit<Product, 'id'> = { 
        ...data, 
        category: data.category || '',
        batch: data.batch || '',
        expirationDate: parsedDate.toISOString() 
      };
      
      await addProduct(newProduct as Product);
      
      let toastDescription = `O produto "${data.name}" foi adicionado com sucesso.`;
      
      if (isNewCatalogItem) {
          const newCatalogItem: Omit<CatalogItem, 'id'> = { 
            code: data.code, 
            name: data.name, 
            category: data.category || '' 
          };
          await addCatalogItem(newCatalogItem as CatalogItem);
          toastDescription += ' Este novo item foi adicionado ao seu catálogo.';
      }

      toast({
        title: 'Produto Salvo!',
        description: toastDescription,
        variant: 'accent',
      });

      form.reset({
         code: '',
         name: '',
         quantity: 1,
         category: '',
         batch: '',
         expirationDate: '',
      });
      setIsNewCatalogItem(false);
      codeInputRef.current?.focus();

    } catch (error: any) {
      console.error("Falha ao salvar produto no formulário:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: error.message || 'Não foi possível salvar o produto. Verifique as regras de segurança do Firestore.'
      });
    } finally {
        setIsSaving(false);
    }
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
  
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldRef?: React.RefObject<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (nextFieldRef?.current) {
            nextFieldRef.current.focus();
        } else {
            // Se não houver próximo campo, submeta o formulário
            submitButtonRef.current?.click();
        }
    }
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
                        ref={codeInputRef}
                        onBlur={handleCodeBlur}
                        onKeyDown={(e) => handleKeyDown(e, nameInputRef)}
                      />
                      {isFetchingCatalog && (
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
                      <Input 
                        placeholder="Ex: Dipirona 500mg" 
                        {...field} 
                        ref={nameInputRef} 
                        onKeyDown={(e) => handleKeyDown(e, categoryInputRef)}
                        readOnly={!isNewCatalogItem && form.getValues('name') !== ''}
                      />
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
                      <Input 
                        placeholder="Ex: Analgésico" 
                        {...field}
                        ref={categoryInputRef}
                        onKeyDown={(e) => handleKeyDown(e, quantityInputRef)}
                        readOnly={!isNewCatalogItem && form.getValues('category') !== ''}
                       />
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
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        ref={quantityInputRef}
                        onKeyDown={(e) => handleKeyDown(e, batchInputRef)}
                       />
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
                      <Input 
                        placeholder="Ex: A22B01" 
                        {...field}
                        ref={batchInputRef}
                        onKeyDown={(e) => handleKeyDown(e, expirationDateInputRef)}
                       />
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
                        ref={expirationDateInputRef}
                        onChange={handleDateChange} 
                        onKeyDown={(e) => handleKeyDown(e, submitButtonRef)}
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving} ref={submitButtonRef}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Produto
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
