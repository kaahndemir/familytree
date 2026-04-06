# Family Tree Builder 🌳

Welcome to the **Family Tree Builder**! A beautiful, open-source, interactive radial tree visualization tool built with Next.js and D3.js. 

![Family Tree Preview](./public/preview.png)

Have you ever wanted to visualize your family tree, your company's organizational chart, or your community network in a stunning, interactive, and modern way? This project allows you to do exactly that, simply by editing a single JSON file. No complex coding required!

## Features

- ✨ **Beautiful Radial Design**: A glowing, dark-themed, and interactive circular tree structure.
- 🎛️ **Zoom & Pan**: Fully interactive map. You can drag and zoom in/out smoothly.
- 🖼️ **Avatars & Links**: Each node supports an image URL and a clickable external link.
- 📥 **High-Resolution PNG Export**: Export your beautiful tree directly as a high-quality PNG with a single click.
- ⚡ **Next.js Powered**: Fast, responsive, and easy to deploy.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/family-tree-builder.git
   cd family-tree-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Edit your Data**
   Open the `data/tree-data.json` file. This is the heart of your tree! Edit it according to the simple JSON standard:
   ```json
   [
     {
       "name": "Acme Corp",
       "imageUrl": "https://example.com/your-logo.png",
       "link": "https://yourwebsite.com",
       "children": [
         {
            "name": "Jane Doe",
            "imageUrl": "https://example.com/jane.jpg"
         }
       ]
     }
   ]
   ```
   *Note: If you plan to export the PNG with images, ensure the images are hosted on a server that allows CORS (Cross-Origin Resource Sharing) or use base64 encoded images, otherwise the browser's security restrictions might prevent the PNG from downloading.*

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying to Production

The easiest way to deploy your tree is using [Vercel](https://vercel.com/new). Once you've added your custom JSON data and pushed to GitHub, Vercel will automatically host it for free!

## License

MIT License - feel free to use it for your personal or commercial projects!
