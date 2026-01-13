import ModalProvider from "./provider/ModalProvider";
import Router from "./router";

function App() {
  return (
    <>
      <ModalProvider>
        <Router />
      </ModalProvider>
    </>
  );
}

export default App;
