'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChartRenderer } from '@/components/charts/renderer';
import type { ChartSpec } from '@/types/chart-spec';
import { PencilSimple, Trash } from 'phosphor-react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import Link from 'next/link';

const DELETE_CARD = gql`
  mutation DeleteCard($dashboardId: ID!, $cardId: ID!) {
    deleteCard(dashboardId: $dashboardId, cardId: $cardId)
  }
`;

const UPSERT_CARD = gql`
  mutation UpsertCardFromRenderer($dashboardId: ID!, $cardId: ID!, $chartSpec: JSON!) {
    upsertCard(dashboardId: $dashboardId, cardId: $cardId, chartSpec: $chartSpec) {
      id
      chartSpec
    }
  }
`;

interface DashboardCardProps {
  title: string;
  spec: ChartSpec;
  cardId: string;
  dashboardId: string;
}

export function DashboardCard({ title, spec, cardId, dashboardId }: DashboardCardProps) {
  const subtitle = spec.options?.subtitle;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentSpec, setCurrentSpec] = useState(spec);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [upsertCard] = useMutation(UPSERT_CARD);

  // Debounced spec change handler for column reordering persistence
  const handleSpecChange = useCallback((newSpec: ChartSpec) => {
    setCurrentSpec(newSpec);

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the save by 500ms
    debounceRef.current = setTimeout(async () => {
      try {
        await upsertCard({
          variables: {
            dashboardId,
            cardId,
            chartSpec: newSpec,
          },
        });
      } catch (error) {
        console.error('Failed to save column order:', error);
      }
    }, 500);
  }, [dashboardId, cardId, upsertCard]);

  const [deleteCard, { loading: deleting }] = useMutation(DELETE_CARD, {
    update(cache) {
      // Update the cache to remove the deleted card
      const dashboardCacheId = cache.identify({ __typename: 'Dashboard', id: dashboardId });
      if (dashboardCacheId) {
        cache.modify({
          id: dashboardCacheId,
          fields: {
            cards(existingCards) {
              const cards = Array.isArray(existingCards) ? existingCards : [];
              return cards.filter((card: any) => card.id !== cardId);
            },
            layout(existingLayout) {
              const layout = Array.isArray(existingLayout) ? existingLayout : [];
              return layout.filter((item: any) => item.i !== cardId);
            }
          }
        });
      }
    },
    onCompleted: () => {
      toast.success('Chart deleted successfully!');
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete chart');
    }
  });

  const handleDelete = async () => {
    try {
      await deleteCard({
        variables: {
          dashboardId,
          cardId
        }
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };
  
  return (
    <Card className="group h-full flex flex-col hover:shadow-md transition-shadow relative">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 drag-handle cursor-grab active:cursor-grabbing">
            <CardTitle className="text-sm font-medium mb-0.5 truncate">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Link href={`/dashboards/${dashboardId}/cards/${cardId}/edit`} className="h-6 w-6">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <PencilSimple size={12} />
                <span className="sr-only">Edit chart</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash size={12} />
              <span className="sr-only">Delete chart</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2 flex-1 flex flex-col min-h-0">
        <ChartRenderer spec={currentSpec} onSpecChange={handleSpecChange} />
      </CardContent>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chart</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
