import { Helmet } from 'react-helmet-async'
import AddPlantForm from '../../../components/Form/AddPlantForm'
import { imageUpload } from '../../../api/utils'
import useAuth from '../../../hooks/useAuth'
import { useState } from 'react'
import useAxiosSecure from '../../../hooks/useAxiosSecure'
import toast from 'react-hot-toast'

const AddPlant = () => {
  const {user}= useAuth()
  const axiosSecure= useAxiosSecure()
  const [uploadBtnText , setUploadBtnText]= useState({image: {name:'Upload'}})
  const [loading ,setLoading]= useState(false)
  const handleAddPlant= async(e)=>{
    setLoading(true)
    e.preventDefault()
    const form = e.target
    const name= form.name.value
    const description=form.description.value
    const price= parseFloat(form.price.value)
    const quantity=parseInt(form.quantity.value)
    const category=form.category.value
    const image =form.image.files[0]
    const image_url= await imageUpload(image)

    const seller={
      name: user?.displayName,
      image:user?.photoURL,
      email: user?.email

    }
    const plantData= {
      name, description, price, quantity, category, image:image_url, seller
    }
    console.table(plantData)
    // save Image on db
    try {
      // fetch 
      await axiosSecure.post("/plants", plantData)
      toast.success("Plant added successfully ")
    } catch (error) {
       console.log(error)
    }finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      {/* Form */}
      <AddPlantForm handleAddPlant={handleAddPlant} uploadBtnText={uploadBtnText} setUploadBtnText={setUploadBtnText} loading={loading}/>
    </div>
  )
}

export default AddPlant
