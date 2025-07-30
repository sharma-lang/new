@@ .. @@
       const { data, error } = await supabase
-        .from('Sensor_data')
+        .from('sensor_data')
         .select('*')
@@ .. @@
   const setupRealtimeSubscription = () => {
     const channel = supabase
-      .channel('Sensor_data_changes')
+      .channel('sensor_data_changes')
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
-          table: 'Sensor_data'
+          table: 'sensor_data'
         },