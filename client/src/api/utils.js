import axios from "axios"

export const imageUpload= async imageData =>{
    const formData = new FormData()
    formData.append('image', imageData)
    const {data}= await axios.post(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_imgbb_Api_Key}`, formData)

     const image_url= data.data.display_url
     return image_url
}