'use client';

import { Card } from '@/components/ui/card';
import { HelpCircle, MessageSquare, BookOpen, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpCenterPage() {
  const helpCategories = [
    {
      icon: BookOpen,
      title: 'Getting Started',
      description: 'Learn the basics of using Digital Wardrobe',
    },
    {
      icon: MessageSquare,
      title: 'FAQs',
      description: 'Find answers to commonly asked questions',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Help Center
          </h1>
          <p className="text-muted-foreground">
            Get help and support for using Digital Wardrobe
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full p-4 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {helpCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Icon className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Contact Support */}
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-4">
            Our support team is here to assist you
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
}
