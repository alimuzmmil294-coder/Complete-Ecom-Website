import { Link } from "react-router-dom";
import { Button } from "../components/ui.jsx";

const Home = () => (
  <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
    <h1 className="text-3xl font-bold">Welcome to MarketPlace</h1>
    <p className="mt-2 max-w-md text-gray-600">
      A multi-vendor marketplace where buyers shop from many independent sellers in one place.
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link to="/buyer/products">
        <Button>Browse Products</Button>
      </Link>
      <Link to="/signup">
        <Button variant="outline">Sign up</Button>
      </Link>
      <Link to="/login">
        <Button variant="secondary">Log in</Button>
      </Link>
    </div>
  </div>
);

export default Home;
