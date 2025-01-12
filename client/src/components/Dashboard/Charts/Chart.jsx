import PropTypes from 'prop-types';
import { ComposedChart, Area, Bar, CartesianGrid, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts'
const Chart = ({ chartData }) => {

    // const mydata ={
    //     date:10/12/24,
    //       quantity: 4000,
    //       price: 2400,
    //       order: 2400
    // }
   

    return (
        <ComposedChart width={730} height={250} data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <CartesianGrid stroke="#f5f5f5" />
            <Area type="monotone" dataKey="order" fill="#8884d8" stroke="#8884d8" />
            <Bar dataKey="price" barSize={20} fill="#413ea0" />
            <Line type="monotone" dataKey="quantity" stroke="#ff7300" />
        </ComposedChart>
    );
};

Chart.propTypes = {
chartData:PropTypes.object
}
export default Chart;