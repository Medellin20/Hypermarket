import Protected from '../../src/components/Protected.jsx';
import Checkout from '../../src/screens/Checkout.jsx';

export default function CheckoutPage() {
  return <Protected><Checkout /></Protected>;
}
