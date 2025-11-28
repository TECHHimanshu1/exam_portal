
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface UseSupabaseQueryOptions<T> {
  tableName: TableName;
  columns?: string;
  filters?: {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike';
    value: any;
  }[];
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  page?: number;
  dependencies?: any[];
  transformResponse?: (data: any[]) => T[];
  relationshipMap?: Record<string, string>;
  countOnly?: boolean;
  groupBy?: string[];
  aggregations?: {
    column: string;
    function: 'avg' | 'sum' | 'min' | 'max' | 'count';
    alias?: string;
  }[];
}

export function useSupabaseQuery<T>({
  tableName,
  columns = '*',
  filters = [],
  orderBy,
  limit,
  page = 1,
  dependencies = [],
  transformResponse,
  relationshipMap = {},
  countOnly = false,
  groupBy = [],
  aggregations = [],
}: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let processedColumns = columns;
        
        // Handle relationship mappings for foreign tables
        if (Object.keys(relationshipMap).length > 0 && columns.includes(',')) {
          const columnParts = columns.split(',').map(col => col.trim());
          const processedParts = columnParts.map(col => {
            const tableName = col.split('(')[0];
            if (relationshipMap[tableName]) {
              return col.replace(tableName, `${tableName}!${relationshipMap[tableName]}`);
            }
            return col;
          });
          processedColumns = processedParts.join(',');
        }

        // Handle aggregations
        if (aggregations.length > 0) {
          processedColumns = aggregations
            .map(agg => {
              const alias = agg.alias || `${agg.function}_${agg.column}`;
              return `${agg.function}(${agg.column}) as ${alias}`;
            })
            .join(', ');
          
          if (groupBy.length > 0) {
            processedColumns += `, ${groupBy.join(', ')}`;
          }
        }

        // Use the query_with_group_by function if GROUP BY is specified
        if (groupBy.length > 0 && aggregations.length > 0) {
          console.log('Using group by function');
          // Preparing the SQL WHERE conditions
          let whereConditions = '';
          if (filters.length > 0) {
            whereConditions = filters.map(filter => {
              return `${filter.column} ${filter.operator} '${filter.value}'`;
            }).join(' AND ');
          }
          
          const { data: responseData, error: responseError } = await supabase
            .rpc('query_with_group_by', {
              table_name: tableName,
              select_columns: processedColumns,
              group_by_columns: groupBy.join(', '),
              where_conditions: whereConditions
            });

          if (responseError) {
            throw responseError;
          }

          const transformedData = transformResponse ? transformResponse(responseData as any[]) : responseData;
          setData(transformedData as T[]);
          
          // Early return since we're using a custom query
          setIsLoading(false);
          return;
        }

        let query = supabase
          .from(tableName)
          .select(processedColumns, { count: countOnly ? 'exact' : undefined });

        // Apply filters
        filters.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        // Apply pagination
        if (limit) {
          const start = (page - 1) * limit;
          query = query.range(start, start + limit - 1);
        }

        const { data: responseData, error: responseError, count: totalCount } = await query;

        if (responseError) {
          throw responseError;
        }

        const transformedData = transformResponse ? transformResponse(responseData) : responseData;
        
        setData(transformedData as T[]);
        setCount(totalCount);
      } catch (err: any) {
        console.error('Error fetching data from Supabase:', err);
        setError(err.message || 'Failed to fetch data');
        toast.error(`Failed to fetch ${tableName}: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tableName, columns, ...filters.map(f => f.value), orderBy?.column, orderBy?.ascending, limit, page, ...dependencies]);

  const refetch = async () => {
    setIsLoading(true);
    setData([] as unknown as T[]);
  };

  return { data, count, error, isLoading, refetch };
}

/**
 * Hook for fetching a single record from Supabase
 */
export function useSupabaseRecord<T>(
  tableName: TableName,
  id: string | undefined,
  columns: string = '*',
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchRecord = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: responseData, error: responseError } = await supabase
          .from(tableName)
          .select(columns)
          .eq('id', id)
          .maybeSingle();

        if (responseError) {
          throw responseError;
        }

        setData(responseData as T);
      } catch (err: any) {
        console.error(`Error fetching ${tableName} record:`, err);
        setError(err.message || `Failed to fetch ${tableName} record`);
        toast.error(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [tableName, id, columns, ...dependencies]);

  return { data, error, isLoading };
}

/**
 * Hook for performing mutations (insert, update, delete) on Supabase
 */
export function useSupabaseMutation<T extends Record<string, any>>(tableName: TableName) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = async (data: Partial<T> | Partial<T>[]): Promise<T | T[] | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: responseData, error: responseError } = await supabase
        .from(tableName)
        .insert(data as any)
        .select();
      
      if (responseError) {
        throw responseError;
      }
      
      toast.success(`Successfully added to ${tableName}`);
      return responseData as unknown as T[];
    } catch (err: any) {
      console.error(`Error inserting into ${tableName}:`, err);
      setError(err.message || `Failed to insert into ${tableName}`);
      toast.error(`Failed to save data: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const update = async (id: string, data: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: responseData, error: responseError } = await supabase
        .from(tableName)
        .update(data as any)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (responseError) {
        throw responseError;
      }
      
      toast.success(`Successfully updated ${tableName}`);
      return responseData as unknown as T;
    } catch (err: any) {
      console.error(`Error updating ${tableName}:`, err);
      setError(err.message || `Failed to update ${tableName}`);
      toast.error(`Failed to update data: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const remove = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: responseError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (responseError) {
        throw responseError;
      }
      
      toast.success(`Successfully deleted from ${tableName}`);
      return true;
    } catch (err: any) {
      console.error(`Error deleting from ${tableName}:`, err);
      setError(err.message || `Failed to delete from ${tableName}`);
      toast.error(`Failed to delete data: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { 
    insert, 
    update, 
    remove, 
    isLoading, 
    error 
  };
}
