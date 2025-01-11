/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { Fragment, useState } from 'react'
import Button from '../Shared/Button/Button'
import toast from 'react-hot-toast'
import useAuth from '../../hooks/useAuth'
import useAxiosSecure from '../../hooks/useAxiosSecure'
import { useNavigate } from 'react-router-dom'

const PurchaseModal = ({ plant, closeModal, isOpen, refetch }) => {
  const {user}= useAuth()
  // Total Price Calculation
  const axiosSecure= useAxiosSecure()
  const navigate= useNavigate()
  const [totalQuantity, setTotalQuantity]= useState(1)
  const [totalPrice, setTotalPrice]= useState(plant?.price)
  const [purchaseInfo, setPurchaseInfo]= useState({
    customer :{
      name:user?.displayName,
      email: user?.email,
      image: user?.photoURL
    },
    plantId:plant._id,
    price: totalPrice,
    quantity:totalQuantity,
    address:"",
    seller: plant.seller.email,
    status:"pending"
  })
  console.log(totalQuantity)

  const handleQuantity = value=>{

    if(value >plant.quantity){
      setTotalQuantity(plant.quantity)
      return toast.error("Quantity exceeds available stock!")

    }
    if(value<0){
      setTotalQuantity(1)
      return toast.error("Quantity cannot less then 1")
    }
    setTotalQuantity(value)
    setTotalPrice(value*plant?.price)
    setPurchaseInfo(prv=>{
      return {...prv, price :value * plant?.price, quantity: value}
    })
  }
  
  const handlePurchase=async()=>{
    console.table(purchaseInfo);
    try{
    await axiosSecure.post("/orders", purchaseInfo)
     toast.success("Order Success")
       await axiosSecure.patch(`/order/quantity/${plant._id}`, {quantityToUpdate:totalQuantity,
        status:'decrease' 
       })
       refetch()

       navigate("/dashboard/my-orders")
    }catch(error){
      console.log(error)

    }
    finally{
      closeModal()
    }
    // save data to db

  }
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </TransitionChild>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <DialogPanel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <DialogTitle
                  as='h3'
                  className='text-lg font-medium text-center leading-6 text-gray-900'
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Plant:{plant?.name}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Category:{plant.category}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Customer:{plant?.seller?.name}</p>
                </div>

                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Price: $ {plant.price}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Available Quantity:{plant.quantity}</p>
                </div>
                {/* quantity input */}
                <div className='space-x-2 mt-2 text-sm'>
                <label htmlFor='quantity' className=' text-gray-600'>
                  Quantity:
                </label>
                <input
                  className=' p-2  text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white'
                 
                 value={totalQuantity}
                 onChange={(e)=>handleQuantity(parseInt(e.target.value))}
                  name='quantity'
                  id='quantity'
                  type='number'
                  placeholder='Available quantity'
                  required
                />
              </div>
                {/* Address input */}
                {/* quantity input */}
                <div className='space-x-2 mt-2 text-sm'>
                <label htmlFor='quantity' className=' text-gray-600'>
                  Address:
                </label>
                <input
                  className=' p-2  text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white'
                
                  name='address'
                  onChange={(e)=>setPurchaseInfo(prv=>{
                    return {...prv, address :e.target.value}
                  })}
                  id='address'
                  type='text'
                  placeholder='Write your address'
                  required
                />
              </div>
                <div className='mt-3'>
                  <Button onClick={handlePurchase} label={`Pay ${totalPrice} $`}/>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default PurchaseModal
