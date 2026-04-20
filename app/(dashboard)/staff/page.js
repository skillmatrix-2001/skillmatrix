import { Suspense } from 'react';
import StaffDashboard from './StaffDashboard';

export default function StaffPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <StaffDashboard />
    </Suspense>
  );
}