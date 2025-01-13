import { useState } from 'react'
import DeleteModal from '../../Modal/DeleteModal'
import UpdatePlantModal from '../../Modal/UpdatePlantModal'
import PropTypes from 'prop-types'
import useAxiosSecure from '../../../hooks/useAxiosSecure'
import toast from 'react-hot-toast'

const PlantDataRow = ({plant, refetch}) => {
  let [isOpen, setIsOpen] = useState(false)
  const axiosSecure= useAxiosSecure()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [plants, setPlants]= useState({})
  const {
    name,
    image,
    category,
    price, 
    quantity,
    _id
    
    
    }=plant || {}

  function openModal() {
    setIsOpen(true)
  }
  function closeModal() {
    setIsOpen(false)
  }

  const handleDelete=async()=>{
    try{
      // 
      await axiosSecure.delete(`/plants/${_id}`)
      toast.success("Your plant is deleted")
      refetch()
      
    }catch(err){
      console.log(err)
    }finally{
      closeModal()
    }
  }
  const handleUpdateBtn= async( id)=>{
    setIsEditModalOpen(true)
    console.log(id)
    try{
      //patch the data of specific id
      const res= await axiosSecure.get(`/plant/${id}`)
      setPlants(res.data)
    }catch(err){
      console.log(err)
    }

  }

  
  
  return (
    <tr>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='block relative'>
              <img
                alt='profile'
                src={image}
                className='mx-auto object-cover rounded h-10 w-15 '
              />
            </div>
          </div>
        </div>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{name}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{category}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{price}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{quantity}</p>
      </td>

      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <span
          onClick={openModal}
          className='relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight'
        >
          <span
            aria-hidden='true'
            className='absolute inset-0 bg-red-200 opacity-50 rounded-full'
          ></span>
          <span className='relative'>Delete</span>
        </span>
        <DeleteModal handleDelete={handleDelete} isOpen={isOpen} closeModal={closeModal} />
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <span
          onClick={() =>handleUpdateBtn(_id) }
          className='relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight'
        >
          <span
            aria-hidden='true'
            className='absolute inset-0 bg-green-200 opacity-50 rounded-full'
          ></span>
          <span className='relative'>Update</span>
        </span>
        <UpdatePlantModal
        plants={plants}
          isOpen={isEditModalOpen}
          refetch={refetch}
          setIsEditModalOpen={setIsEditModalOpen}
        />
      </td>
    </tr>
  )
}
PlantDataRow.propTypes = {
  plant: PropTypes.object,
  refetch: PropTypes.func,
  
}

export default PlantDataRow
