import { HorizontalHeader } from '@/components/layouts/HorizontalHeader';
import { VerticalHeader } from '@/components/layouts/VerticalHeader';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Digital Wardrobe',
  description: 'Manage your digital wardrobe',
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <VerticalHeader />
      <main className="md:pl-15">
        <HorizontalHeader/>

        {children}
      </main>
      <Toaster />
    </div>
  );
}
