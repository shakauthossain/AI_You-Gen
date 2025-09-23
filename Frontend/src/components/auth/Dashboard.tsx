import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/NavigationHeader";

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
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="p-4 pt-20">
        <Button onClick={callBackend}>Call Backend</Button>
      </div>
    </div>
  );
}

export { Dashboard };
