"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import Loading from '@/components/ui/loading';
import { useParams } from 'next/navigation';

async function getTokenParams(params: { token: string }) {
  return params;
}

export default function RedeemTransferLink() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [linkDetails, setLinkDetails] = useState<any>(null);

  const { token } = useParams();

  useEffect(() => {
    const fetchLinkDetails = async () => {
      try {
        const res = await fetch(`/api/payment/link-details/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        setLinkDetails(data);
      } catch (error) {
        router.push('/transfer/invalid-link');
      }
    };
    
    fetchLinkDetails();
  }, [token, router]);

  const acceptTransfer = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/process-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          recipientId: profile?.id
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast({
        title: "Success",
        description: `$${linkDetails.amount} has been added to your balance`,
      });
      
      router.push('/menu');
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process transfer",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!linkDetails) return <Loading />;

  return (
    <div className="container max-w-md py-12 flex items-center justify-center">
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold">Incoming Transfer</h1>
        
        <div className="space-y-2">
          <p className="text-4xl font-bold">${linkDetails.amount}</p>
          {linkDetails.note && (
            <p className="text-muted-foreground">"{linkDetails.note}"</p>
          )}
        </div>
        
        <div className="pt-6">
          <Button 
            onClick={acceptTransfer}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Accept Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
}