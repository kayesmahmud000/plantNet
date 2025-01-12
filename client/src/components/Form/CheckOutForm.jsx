/* eslint-disable react-hooks/exhaustive-deps */

// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web

 // go the stripe react github >> example >> hook >> card minimal.js and copy the hole component 


import {CardElement,  useElements, useStripe} from '@stripe/react-stripe-js'; //import properly
import './form.css'
import Button from '../Shared/Button/Button';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
// /change th css file

const CheckoutForm = ({purchaseInfo, closeModal, refetch, totalQuantity}) => {
  const [clientSecret, setClientSecret]= useState('')
  const [processing, setProcessing]= useState(false)
  const axiosSecure= useAxiosSecure()
  const navigate= useNavigate()
  const stripe = useStripe();
  const elements = useElements();
   useEffect(()=>{
    getPaymentIntent()
    
   },[purchaseInfo])

   console.log(clientSecret)

   const getPaymentIntent = async()=>{
    try{
     const res= await axiosSecure.post('/create-payment-intent', {quantity: purchaseInfo?.quantity, plantId: purchaseInfo?.plantId})
  setClientSecret(res.data.clientSecret)
    }catch(err){
      console.log(err?.response?.data?.massage)
    }
   }

  const handleSubmit = async (event) => {
    setProcessing(true)
    // Block native form submission.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const card = elements.getElement(CardElement);

    if (card == null) {
      setProcessing(false)
      return;
    }

    // Use your card Element with other Stripe.js APIs
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (error) {
      setProcessing(false)
      return console.log('[error]', error);
      
    } else {
      console.log('[PaymentMethod]', paymentMethod);
    }
    // confirm card payment || search google >> stripe confirm card payment

  const {paymentIntent}= await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card:card,
      billing_details: {
        name: purchaseInfo?.customer?.name,
        email: purchaseInfo?.customer?.email
      },
    },
  })
  console.log(paymentIntent)
  if(paymentIntent.status=== 'succeeded'){
    try{
      await axiosSecure.post("/orders",{... purchaseInfo, transactionId: paymentIntent?.id})
       toast.success("Order Success")
         await axiosSecure.patch(`/order/quantity/${purchaseInfo?.plantId}`, {quantityToUpdate:totalQuantity,
          status:'decrease' 
         })
         refetch()
  
         navigate("/dashboard/my-orders")
      }catch(error){
        console.log(error)
  
      }
      finally{
        setProcessing(false)
        closeModal()
      }
  }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
     <div className='flex justify-between gap-2 items-center'>
     <Button type='submit' disabled={!stripe || !clientSecret || processing} label={`Pay ${purchaseInfo?.price} $`}/>
   <Button outline={true} onClick={closeModal} label={"Cancel"}/>
     </div>
    </form>
  );
};


CheckoutForm.propTypes = {
  purchaseInfo:PropTypes.object,
  totalQuantity:PropTypes.number,
  closeModal:PropTypes.func,
  refetch:PropTypes.func,
}
export default CheckoutForm;