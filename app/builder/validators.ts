import * as yup from 'yup';

const addressSchema = yup.object().shape({
  addressOne: yup.string().required('Address line 1 is required'),

  addressTwo: yup.string(), // Optional

  zipcode: yup
    .string()
    .matches(/^\d{6}$/, 'Zipcode must be a 6-digit number')
    .required('Zipcode is required'),
  
  exportType: yup.string().required('Export type is required'),
});

export default addressSchema;