import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PostPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-slate-900 p-6">
      <div className="w-[500px] mx-auto space-y-4">
        <div className="flex justify-center relative mb-6">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 bottom-0 text-slate-100"
          >
            <ChevronLeft />
          </button>
        </div>

        <div className="bg-slate-200 p-4 rounded-md">
          <h2 className="text-xl font-bold text-slate-600"></h2>
          <p className="text-slate-600"></p>
        </div>
      </div>
    </div>
  );
}

export default PostPage;
