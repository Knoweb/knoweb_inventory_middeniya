# 📦 Installation Instructions

## Option 1: Install lucide-react (Recommended)

The Manufacturing Product Form uses lucide-react icons for a modern, clean look.

```bash
cd inventory-frontend
npm install lucide-react
```

Then the form is ready to use!

## Option 2: Use react-icons version (No installation needed)

If you prefer not to install lucide-react, use the alternative version that works with the existing react-icons package:

**Use:** `ManufacturingProductForm_ReactIcons.jsx` instead of `ManufacturingProductForm.jsx`

Both versions have identical functionality and styling - only the icon library differs.

---

## Quick Start After Installation

1. **Import the component:**
```jsx
import ManufacturingProductForm from './components/ManufacturingProductForm';
```

2. **Use in your component:**
```jsx
const [showForm, setShowForm] = useState(false);

return (
  <>
    <button onClick={() => setShowForm(true)}>
      Create Item
    </button>
    
    {showForm && (
      <ManufacturingProductForm 
        onSubmit={(data) => console.log(data)}
        onCancel={() => setShowForm(false)}
      />
    )}
  </>
);
```

3. **Test with the demo page:**
```
http://localhost:5173/manufacturing-form-demo
```

---

## Verification

After installation, verify lucide-react is working:

```bash
npm list lucide-react
```

You should see: `lucide-react@0.x.x`
