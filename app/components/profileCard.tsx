import { motion } from "framer-motion"
import Profile from "../types/profile";
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Trash2,
  Edit3,
  Save,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge";

interface ProfileCardProps {
  profile: Profile
  index: number
  isEditing: boolean
  currentPage: number
  pageCount: number
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onUpdate: (updates: Partial<Profile>) => void
  onDelete: () => void
  onCopyShippingToBilling: () => void
}

export default function ProfileCard({
  profile,
  index,
  isEditing,
  currentPage,
  pageCount,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
  onDelete,
  onCopyShippingToBilling,
}: ProfileCardProps) {
  const [editedProfile, setEditedProfile] = useState<Profile>(profile)

  const handleSave = () => {
    onUpdate(editedProfile)
    onSave()
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    onCancel()
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Edit Profile {(currentPage - 1) * pageCount + index + 1}</h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              className="group border-gray-300 text-green-600 hover:text-green-600 bg-white hover:bg-green-50 hover:border-green-300 transition-colors duration-200"
            >
              <Save className="w-4 h-4 mr-1 text-green-600" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="group border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200"
            >
              <X className="w-4 h-4 mr-1 text-gray-700 group-hover:text-gray-700" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info and Shipping Address */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">Basic Information</h4>
              <div></div>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="bg-white border-gray-300 text-gray-800 text-sm w-full"
              />
              <Input
                placeholder="Phone"
                value={editedProfile.phone}
                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                className="bg-white border-gray-300 text-gray-800 text-sm w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">Shipping Address</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditedProfile({
                    ...editedProfile,
                    billingAddress: { ...editedProfile.shippingAddress },
                  })
                }}
                className="invisible"
              >
                Copy from Shipping
              </Button>
            </div>
            <div className="space-y-3 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Shipping First Name"
                  value={editedProfile.shippingAddress.firstName}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      shippingAddress: { ...editedProfile.shippingAddress, firstName: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
                <Input
                  placeholder="Shipping Last Name"
                  value={editedProfile.shippingAddress.lastName}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      shippingAddress: { ...editedProfile.shippingAddress, lastName: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
              </div>
              <Input
                placeholder="Address Line 1"
                value={editedProfile.shippingAddress.address1}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    shippingAddress: { ...editedProfile.shippingAddress, address1: e.target.value },
                  })
                }
                className="bg-white border-gray-300 text-gray-800 text-sm"
              />
              <Input
                placeholder="Address Line 2"
                value={editedProfile.shippingAddress.address2}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    shippingAddress: { ...editedProfile.shippingAddress, address2: e.target.value },
                  })
                }
                className="bg-white border-gray-300 text-gray-800 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={editedProfile.shippingAddress.city}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      shippingAddress: { ...editedProfile.shippingAddress, city: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
                <Input
                  placeholder="State"
                  value={editedProfile.shippingAddress.state}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      shippingAddress: { ...editedProfile.shippingAddress, state: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
                <Input
                  placeholder="ZIP"
                  value={editedProfile.shippingAddress.zipCode}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      shippingAddress: { ...editedProfile.shippingAddress, zipCode: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Card Information and Billing Address */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">Card Information</h4>
              <div></div>
            </div>
            <div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Card Number"
                    value={editedProfile.card.number}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        card: { ...editedProfile.card, number: e.target.value },
                      })
                    }
                    className="bg-white border-gray-300 text-gray-800 text-sm flex-[0.85]"
                  />
                  <Input
                    placeholder="MM/YY"
                    value={editedProfile.card.exp}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        card: { ...editedProfile.card, exp: e.target.value },
                      })
                    }
                    className="bg-white border-gray-300 text-gray-800 text-sm flex-[0.15]"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Card Holder"
                    value={editedProfile.card.holderName}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        card: { ...editedProfile.card, holderName: e.target.value },
                      })
                    }
                    className="bg-white border-gray-300 text-gray-800 text-sm flex-[0.85]"
                  />
                  <Input
                    placeholder="CVV"
                    value={editedProfile.card.cvv}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        card: { ...editedProfile.card, cvv: e.target.value },
                      })
                    }
                    className="bg-white border-gray-300 text-gray-800 text-sm flex-[0.15]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">Billing Address</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditedProfile({
                    ...editedProfile,
                    billingAddress: { ...editedProfile.shippingAddress },
                  })
                }}
                className="border-gray-300 text-blue-600 hover:text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 text-xs m-0"
              >
                Copy from Shipping
              </Button>
            </div>
            <div className="space-y-3 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Billing First Name"
                  value={editedProfile.billingAddress.firstName}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      billingAddress: { ...editedProfile.billingAddress, firstName: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
                <Input
                  placeholder="Billing Last Name"
                  value={editedProfile.billingAddress.lastName}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      billingAddress: { ...editedProfile.billingAddress, lastName: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
              </div>
              <Input
                placeholder="Address Line 1"
                value={editedProfile.billingAddress.address1}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    billingAddress: { ...editedProfile.billingAddress, address1: e.target.value },
                  })
                }
                className="bg-white border-gray-300 text-gray-800 text-sm"
              />
              <Input
                placeholder="Address Line 2"
                value={editedProfile.billingAddress.address2}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    billingAddress: { ...editedProfile.billingAddress, address2: e.target.value },
                  })
                }
                className="bg-white border-gray-300 text-gray-800 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={editedProfile.billingAddress.city}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      billingAddress: { ...editedProfile.billingAddress, city: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
                <Input
                  placeholder="State"
                  value={editedProfile.billingAddress.state}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      billingAddress: { ...editedProfile.billingAddress, state: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
                <Input
                  placeholder="ZIP"
                  value={editedProfile.billingAddress.zipCode}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      billingAddress: { ...editedProfile.billingAddress, zipCode: e.target.value },
                    })
                  }
                  className="bg-white border-gray-300 text-gray-800 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-gray-200 rounded-lg p-4 pr-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              Profile {(currentPage - 1) * pageCount + index + 1}
            </Badge>
            <h3 className="text-gray-800 font-medium">
              {profile.firstName} {profile.lastName}
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Phone:</strong> {profile.phone}
              </p>
            </div>
            <div>
              <p>
                <strong>Shipping:</strong> {profile.shippingAddress.address1 || "Not set"}
              </p>
              <p>
                <strong>City:</strong> {profile.shippingAddress.city || "Not set"}
              </p>
            </div>
            <div>
              <p>
                <strong>Card:</strong> {profile.card.number ? `****${profile.card.number.slice(-4)}` : "Not set"}
              </p>
              <p>
                <strong>Exp:</strong>{" "}
                {profile.card.exp
                  ? `${profile.card.exp}`
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="group border-gray-300 text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="group border-gray-300 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}