import { createSignal } from "solid-js";
import "./App.css";

import { isAvailable } from '@tauri-apps/plugin-nfc';

function App() {
    const [avial, setAvial] = createSignal<Boolean>(false);
    isAvailable().then((a) => {
        setAvial(a);
    });


    return (
        <main class="container">
            <p>{avial() ? "true" : "false"}</p>
        </main>
    );
}

export default App;
