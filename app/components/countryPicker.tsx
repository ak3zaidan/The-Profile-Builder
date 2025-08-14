import Select, {
  components,
  OptionProps,
  SingleValueProps,
  StylesConfig,
  ClassNamesConfig,
} from 'react-select'
import countryList from 'react-select-country-list'
import { useMemo } from 'react'
import ReactCountryFlag from 'react-country-flag'

type CountryData = { label: string; value: string }
const countryOptions: CountryData[] = countryList().getData()

// Custom option renderer (flag + label)
function FlagOption(props: OptionProps<CountryData, false>) {
  return (
    <components.Option {...props}>
      <div className="flex items-center py-0.5">
        <ReactCountryFlag
          countryCode={props.data.value}
          svg
          style={{ width: '1.25em', height: '1.25em' }}
          className="mr-2"
        />
        <span className="text-sm font-medium">{props.data.label}</span>
      </div>
    </components.Option>
  )
}

// Custom singleValue: show flag icon and country name
function FlagSingleValue(
  props: SingleValueProps<CountryData, false>
) {
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <ReactCountryFlag
          countryCode={props.data.value}
          svg
          style={{ width: '1.25em', height: '1.25em' }}
        />
        <span className="text-sm font-medium text-gray-900">{props.data.label}</span>
      </div>
    </components.SingleValue>
  )
}

interface CountryPickerProps {
  value: string
  onChange: (value: string, label: string) => void
  disabled?: boolean
  /** Custom react-select styles (merged with defaults) */
  styles?: StylesConfig<CountryData, false>
  className?: string
  classNames?: ClassNamesConfig<CountryData, false>
}

export default function CountryPicker({
  value,
  onChange,
  disabled = false,
  styles,
  className,
  classNames,
}: CountryPickerProps) {
  const options = useMemo(() => countryOptions, [])

  const mergedStyles: StylesConfig<CountryData, false> = {
    control: (base, state) => ({
      ...base,
      border: state.isFocused ? '1px solid #2563eb' : '1px solid #d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.25)' : 'none',
      minHeight: '36px',
      backgroundColor: '#f9fafb',
      width: '100%',
      borderRadius: '0.375rem',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: state.isFocused ? '#2563eb' : '#9ca3af',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 8px',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '4px 8px',
      color: '#6b7280',
      '&:hover': {
        color: '#374151',
      },
    }),
    indicatorsContainer: (base) => ({
      ...base,
      padding: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6B7280',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: '0.375rem',
      marginTop: '4px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f9fafb' : 'white',
      color: state.isFocused ? '#2563eb' : '#1f2937',
      padding: '6px 12px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f9fafb',
      },
      '&:active': {
        backgroundColor: '#dbeafe',
        color: '#2563eb',
      },
    }),
    input: (base) => ({
      ...base,
      color: '#1f2937',
    }),
    ...styles,
  }

  return (
    <Select<CountryData, false>
      options={options}
      value={options.find((opt) => opt.value === value) ?? null}
      onChange={(opt) => onChange(opt?.value ?? '', opt?.label ?? '')}
      isDisabled={disabled}
      isSearchable={true}
      components={{
        Option: FlagOption,
        SingleValue: FlagSingleValue,
        IndicatorSeparator: () => null,
      }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      styles={mergedStyles}
      className={className}
      classNames={classNames}
      placeholder="Search country..."
    />
  )
}