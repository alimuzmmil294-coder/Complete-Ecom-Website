import { Link } from "react-router-dom";
import { Button } from "../components/ui.jsx";

const Home = () => (
  <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 text-center">
    <h1 className="text-3xl font-bold">Welcome to MarketPlace</h1>
    <p className="mt-2 max-w-md text-gray-600">
      A multi-vendor marketplace where buyers shop from many independent sellers in one place.
    </p>
    <div className="mt-6 flex gap-3">
      <Link to="/signup">
        <Button>Get started</Button>
      </Link>
      <Link to="/login">
        <Button variant="outline">Log in</Button>
      </Link>
    </div>
  </div>
);

export default Home;
