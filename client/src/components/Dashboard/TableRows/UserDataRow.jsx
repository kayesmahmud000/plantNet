import { useState } from 'react'
import UpdateUserModal from '../../Modal/UpdateUserModal'
import PropTypes from 'prop-types'
import useAxiosSecure from '../../../hooks/useAxiosSecure'
import toast from 'react-hot-toast'

const UserDataRow = ({ user, refetch }) => {
  const [isOpen, setIsOpen] = useState(false)
const axiosSecure= useAxiosSecure()
  // role update
  const handleUpdateRole= async(selected)=>{

    if(user.role=== selected) return
    console.log(selected)
    try{
     await axiosSecure.patch(`/user/role/${user?.email}`, {role: selected})
   
    toast.success("Role Update successful!")
    refetch()
    }catch(err){
      toast.error(err.response.data.massage)
      console.log(err)
    }finally{
      
      setIsOpen(false)
      
    }

  }

  return (
    <tr>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{user?.email}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{user?.role}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
       {
        user?.status ? <p className={`${user.status==="requested"?'text-yellow-500':'text-green-500'} whitespace-no-wrap`}>{user?.status }</p>: <p className='text-red-500 whitespace-no-wrap'> 
          Unavailable
        </p>
       }
      </td>

      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <span
          onClick={() => setIsOpen(true)}
          className='relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight'
        >
          <span
            aria-hidden='true'
            className='absolute inset-0 bg-green-200 opacity-50 rounded-full'
          ></span>
          <span className='relative'>Update Role</span>
        </span>
        {/* Modal */}
        <UpdateUserModal handleUpdateRole={handleUpdateRole} role={user.role} isOpen={isOpen} setIsOpen={setIsOpen} />
      </td>
    </tr>
  )
}

UserDataRow.propTypes = {
  user: PropTypes.object,
  refetch: PropTypes.func,
}

export default UserDataRow
