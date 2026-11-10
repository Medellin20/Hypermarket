import Protected from '../../src/components/Protected.jsx';
import Admin from '../../src/screens/Admin.jsx';

export default function AdminPage() {
  return <Protected admin><Admin /></Protected>;
}
