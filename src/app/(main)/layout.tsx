import { HorizontalHeader } from '@/components/layouts/HorizontalHeader';
import { VerticalHeader } from '@/components/layouts/VerticalHeader';

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
      <main className="pl-15">
        <HorizontalHeader/>

        {children}
      </main>
    </div>
  );
}
