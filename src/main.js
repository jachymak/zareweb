import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router/router.js";

import "@/assets/style.css";
import "@/assets/fonts.css";

const app = createApp(App);

app.use(router);

app.mount("#app");
