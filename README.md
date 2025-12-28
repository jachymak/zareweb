# zareweb

Skautský oddíl Záře website.

## Project setup

This project was created using these commands, according to the [Tailwind tutorial](https://tailwindcss.com/docs/installation/using-vite).

````
npm create vite@latest zareweb
- vue
- javascript
- no

npm install tailwindcss @tailwindcss/vite

npm install -D prettier prettier-plugin-tailwindcss

+ add code to `vite.config.js` and `style.css` (see Tailwind tutorial)
````

To compile and run it during developement use `npm run dev`. Compile for production using `npm run build`.


Prettier setup:

✅ Option B: inside package.json
If you prefer fewer config files:
{
"name": "zareweb",
"private": true,
"prettier": {
"plugins": ["prettier-plugin-tailwindcss"]
}
}

In WebStorm:
Settings → Languages & Frameworks → JavaScript → Prettier
✔ Enable Prettier
✔ Run on save (optional)
Prettier package:
Use project local Prettier (node_modules/prettier)



npm install @vuepic/vue-datepicker
