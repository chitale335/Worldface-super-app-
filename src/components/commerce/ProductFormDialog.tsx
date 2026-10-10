import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PRODUCT_CATEGORIES, friendlyError, uploadProductImage, type Product } from "@/lib/commerce";

const schema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: z.string().trim().max(4000),
  price: z.number().int().positive("Price must be above 0").max(100_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  location: z.string().trim().max(120),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product?: Product | null;
  onSaved: () => void;
}

export const ProductFormDialog = ({ open, onOpenChange, product, onSaved }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [category, setCategory] = useState<string>("Other");
  const [location, setLocation] = useState("");
  const [isDigital, setIsDigital] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(product?.title ?? "");
    setDescription(product?.description ?? "");
    setPrice(product ? String(product.price) : "");
    setStock(product ? String(product.stock) : "1");
    setCategory(product?.category ?? "Other");
    setLocation(product?.location ?? "");
    setIsDigital(product?.is_digital ?? false);
    setImages(product?.images ?? []);
  }, [open, product]);

  const onFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 6 - images.length)) urls.push(await uploadProductImage(user.id, f));
      setImages((i) => [...i, ...urls]);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ title, description, price: Number(price), stock: Number(stock), location });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const d = parsed.data as z.infer<typeof schema>;
    const row = {
      title: d.title, description: d.description, price: d.price, stock: d.stock,
      location: d.location || null, category, is_digital: isDigital, images,
      status: parsed.data.stock === 0 && !isDigital ? "sold_out" : (product?.status === "hidden" ? "hidden" : "active"),
    };
    const { error } = product
      ? await supabase.from("products").update(row).eq("id", product.id)
      : await supabase.from("products").insert({ ...row, seller_id: user.id });
    setSaving(false);
    if (error) return toast.error(friendlyError(error));
    toast.success(product ? "Product updated" : "Product listed");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "Edit product" : "Sell a product / Uza bidhaa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Photos</Label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {images.map((src) => (
                <div key={src} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => setImages((i) => i.filter((x) => x !== src))}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="aspect-square rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/40">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                </label>
              )}
            </div>
          </div>
          <div><Label htmlFor="pt">Title</Label><Input id="pt" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label htmlFor="pd">Description</Label><Textarea id="pd" rows={4} value={description} maxLength={4000} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="pp">Price (coins)</Label><Input id="pp" type="number" inputMode="numeric" min={1} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div><Label htmlFor="ps">Stock</Label><Input id="ps" type="number" inputMode="numeric" min={0} value={stock} disabled={isDigital} onChange={(e) => setStock(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="pl">Location</Label><Input id="pl" value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi" /></div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div><p className="text-sm font-medium">Digital product</p><p className="text-xs text-muted-foreground">Delivered instantly, no stock limit</p></div>
            <Switch checked={isDigital} onCheckedChange={setIsDigital} />
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{product ? "Save changes" : "Publish listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
