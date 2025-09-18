import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

function Dashboard() {
  const { getToken } = useAuth();

  async function callBackend() {
    const token = await getToken();
    const res = await fetch("http://localhost:8000/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    console.log(data);
  }

  return (
    <div className="p-4">
      <Button onClick={callBackend}>Call Backend</Button>
    </div>
  );
}

export { Dashboard };