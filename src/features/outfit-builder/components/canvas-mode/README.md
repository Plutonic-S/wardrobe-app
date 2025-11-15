# Canvas Mode Sidebar Components

A collection of interconnected components for browsing, filtering, and dragging wardrobe items onto a canvas in the Outfit Builder.

## Components

### 1. Sidebar.tsx (Main Container)
The orchestrator component that manages state and coordinates all child components.

**Features:**
- Search and category filtering with AND logic
- Responsive design with mobile toggle
- Sticky search header
- Scrollable category sections
- Auto-closes on mobile when dragging starts

**Usage:**
```tsx
import { Sidebar } from '@/features/outfit-builder/components/canvas-mode';
import { useOutfitBuilder } from '@/features/outfit-builder/hooks/useOutfitBuilder';

function CanvasMode() {
  const { wardrobeItems } = useOutfitBuilder();

  const handleItemDragStart = (itemId: string) => {
    console.log('Started dragging:', itemId);
  };

  return (
    <Sidebar
      wardrobeItems={wardrobeItems}
      onItemDragStart={handleItemDragStart}
    />
  );
}
```

**Props:**
- `wardrobeItems`: Array of `ClothResponse` items from wardrobe
- `onItemDragStart`: Callback when user starts dragging an item

---

### 2. SearchBar.tsx
Text input with debounced search functionality.

**Features:**
- Debounced input using `useDeferredValue` (prevents excessive re-renders)
- Clear button appears when text exists
- Search icon visual indicator
- Auto-syncs with external value changes

**Props:**
- `value`: Current search string
- `onChange`: Callback when search value changes

---

### 3. QuickFilters.tsx
Multi-select category filter with visual checkboxes.

**Features:**
- 2-column grid layout
- Category icons and labels
- Item count badges (always shows total, not filtered)
- "Clear all" button when filters active
- Primary color highlighting for selected categories

**Props:**
- `selectedCategories`: Array of selected category values
- `onToggle`: Callback to toggle category selection
- `categoryCounts`: Record of item counts per category

---

### 4. CategorySection.tsx
Collapsible accordion section for a single category.

**Features:**
- Shows icon, label, and item count in header
- Responsive grid (1 col mobile, 2 cols desktop)
- Auto-hides if no items in category
- Accordion collapse/expand functionality

**Props:**
- `category`: The category type (e.g., 'tops', 'bottoms')
- `items`: Array of items in this category
- `onItemDragStart`: Callback when user starts dragging an item

---

### 5. DraggableItem.tsx
Individual clothing item card with HTML5 drag functionality.

**Features:**
- Native HTML5 drag-and-drop
- Thumbnail image with fallback (first letter of name)
- Season badges (overlay on image + below)
- Hover effects (scale, shadow)
- Drag state visual feedback (opacity, scale)

**Drag Data Format:**
```javascript
// Plain text (item ID)
e.dataTransfer.setData('text/plain', item.id);

// Full item data as JSON
e.dataTransfer.setData('application/json', JSON.stringify(item));
```

**Props:**
- `item`: The `ClothResponse` object to display
- `onDragStart`: Callback when drag starts (receives item ID)

---

## Data Flow

```
User Input → Sidebar (state) → Filter Logic → Group by Category
                                                    ↓
                        CategorySection (per category) → DraggableItem (per item)
                                                                    ↓
                                                        HTML5 Drag Event → Canvas Drop Zone
```

## Integration with Canvas

The Canvas component should listen for drop events and extract item data:

```tsx
function Canvas() {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    // Get item data
    const itemId = e.dataTransfer.getData('text/plain');
    const itemJson = e.dataTransfer.getData('application/json');
    const item = JSON.parse(itemJson) as ClothResponse;

    // Get drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add item to canvas at position
    addCanvasItem({
      id: crypto.randomUUID(),
      clothItemId: item.id,
      position: { x, y },
      size: { width: 200, height: 200 },
      rotation: 0,
      zIndex: 0,
    });
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="canvas-drop-zone"
    >
      {/* Canvas items */}
    </div>
  );
}
```

## Styling

All components use:
- Tailwind CSS classes
- shadcn/ui components (Card, Badge, Accordion, etc.)
- Consistent spacing (`p-4`, `gap-3`)
- Theme-aware colors (`bg-card`, `text-foreground`, etc.)

## Accessibility

- Proper ARIA labels on buttons
- Keyboard navigation for accordions and checkboxes
- Focus indicators on interactive elements
- Alt text for images (uses item name)

## Testing Checklist

- [ ] Search filters items by name (case-insensitive)
- [ ] Category checkboxes work independently
- [ ] Multiple categories can be selected (AND logic)
- [ ] Items are draggable (cursor changes)
- [ ] No items shown when all filtered out
- [ ] Empty state message displays correctly
- [ ] Mobile sidebar toggles with hamburger button
- [ ] Mobile sidebar closes when dragging starts
- [ ] Images load with fallback placeholders
- [ ] Season badges display correctly
- [ ] Category counts are accurate
- [ ] Clear all button works
- [ ] Accordion sections expand/collapse
- [ ] Responsive layout works on all screen sizes

## Future Enhancements

- [ ] Advanced filters (season, style type, brand)
- [ ] Sort options (name, recent, favorites)
- [ ] Favorites quick filter
- [ ] Drag preview image
- [ ] Multi-item drag selection
- [ ] Virtual scrolling for large wardrobes
