import Protected from '../../src/components/Protected.jsx';
import Orders from '../../src/screens/Orders.jsx';

export default function OrdersPage() {
  return <Protected><Orders /></Protected>;
}
