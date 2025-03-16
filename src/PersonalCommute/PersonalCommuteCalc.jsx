"use client"

import { useState, useEffect } from "react"
import { TreesIcon as Tree, Share2 } from "lucide-react"

// Constants
// The average tree absorbs about 25kg of CO2 per year
const KG_CO2_PER_TREE_PER_YEAR = 25

/**
 * PersonalCalculator Component
 *
 * This component allows users to calculate and visualize the carbon footprint
 * of their daily commute and see how many trees would be needed to offset it.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Title for the calculator
 * @param {string} props.description - Description text for the calculator
 */
export default function PersonalCalculator({
  title = "Visualise Your Commute",
  description = "See how many trees you need to plant to offset your daily commute",
}) {
  // Calculator state
  const [homePostcode, setHomePostcode] = useState("")
  const [workPostcode, setWorkPostcode] = useState("")
  const [travelMethod, setTravelMethod] = useState("")
  const [carbonEmissions, setCarbonEmissions] = useState(null)
  const [treesNeeded, setTreesNeeded] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shareTooltip, setShareTooltip] = useState("Copy link")
  const [isSharedView, setIsSharedView] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // CTA form state
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState("idle") // "idle" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("")

  /**
   * Check for URL parameters on load to handle shared views
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const trees = urlParams.get("trees")
    const emissions = urlParams.get("emissions")
    const method = urlParams.get("method")

    if (trees && emissions) {
      setTreesNeeded(Number.parseInt(trees, 10))
      setCarbonEmissions(Number.parseFloat(emissions))
      setIsSharedView(true)

      if (method) setTravelMethod(method)
    }
  }, [])

  /**
   * Calculate how many trees are needed to offset the emissions in one year
   *
   * @param {number} emissions - Carbon emissions in kg CO2 for a one-way journey
   * @returns {number} - Number of trees needed to offset annual emissions
   */
  const calculateTreesNeeded = (emissions) => {
    // Assuming daily commute (both ways) for 230 working days per year
    const annualEmissions = emissions * 2 * 230 // kg CO2
    return Math.ceil(annualEmissions / KG_CO2_PER_TREE_PER_YEAR)
  }

  /**
   * Handle the visualization calculation when the user submits the form
   */
  const handleVisualize = async () => {
    // Validate inputs
    if (!homePostcode || !workPostcode || !travelMethod) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("https://carbonfreecommutes-backend.onrender.com/single-journey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: homePostcode.replace(' ', '').toUpperCase(),
          destination: workPostcode.replace(' ', '').toUpperCase(),
          mode: travelMethod.toLowerCase(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to calculate carbon emissions")
      }

      const data = await response.json()
      console.log(data)

      // Update to use the new API response format
      const emissions = data.emissions_kgCO2e
      setCarbonEmissions(emissions)
      setTreesNeeded(calculateTreesNeeded(emissions))
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate a shareable link with the calculation results
   *
   * @returns {string} - URL with query parameters for sharing
   */
  const generateShareableLink = () => {
    if (carbonEmissions === null) return ""

    const url = new URL(window.location.href)
    url.search = ""

    const params = new URLSearchParams()
    params.append("trees", treesNeeded.toString())
    params.append("emissions", carbonEmissions.toString())
    if (travelMethod) params.append("method", travelMethod)
    // Postcodes are intentionally excluded from the URL for privacy

    return `${url.toString()}?${params.toString()}`
  }

  /**
   * Handle the share button click - copy link to clipboard
   */
  const handleShare = async () => {
    const shareableLink = generateShareableLink()

    try {
      await navigator.clipboard.writeText(shareableLink)
      setShareTooltip("Copied!")
      setShowTooltip(true)
      setTimeout(() => {
        setShareTooltip("Copy link")
        setShowTooltip(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy link: ", err)
    }
  }

  return (
    /* Main card container */
    <div className="card w-full max-w-3xl mx-auto bg-base-100 shadow-md">
      {/* Card header */}
      <div className="p-6 border-b border-base-300">
        {/* Title - changes based on whether this is a shared view */}
        <h2 className="text-2xl font-bold text-base-content">
          {isSharedView ? "Shared Commute Visualization" : title}
        </h2>
        {/* Description - changes based on whether this is a shared view */}
        <p className="text-base-content/70 mt-1">
          {isSharedView ? "Someone shared this commute carbon footprint visualization with you" : description}
        </p>
      </div>

      {/* Card content */}
      <div className="p-6 space-y-6">
        {/* Input form - only shown if not in shared view mode */}
        {!isSharedView && (
          <>
            {/* Postcode input fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Home postcode input */}
              <div className="form-control">
                <label htmlFor="home-postcode" className="label">
                  <span className="label-text">Home Postcode</span>
                </label>
                <input
                  id="home-postcode"
                  type="text"
                  placeholder="e.g. SW1A 1AA"
                  value={homePostcode}
                  onChange={(e) => setHomePostcode(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Work postcode input */}
              <div className="form-control">
                <label htmlFor="work-postcode" className="label">
                  <span className="label-text">Work Postcode</span>
                </label>
                <input
                  id="work-postcode"
                  type="text"
                  placeholder="e.g. EC2A 1NT"
                  value={workPostcode}
                  onChange={(e) => setWorkPostcode(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            {/* Travel method dropdown */}
            <div className="form-control">
              <label htmlFor="travel-method" className="label">
                <span className="label-text">Travel Method</span>
              </label>
              <select
                id="travel-method"
                value={travelMethod}
                onChange={(e) => setTravelMethod(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="" disabled>
                  Select your commute method
                </option>
                <option value="car_diesel">Car - Diesel</option>
                <option value="car_hybrid">Car - Hybrid</option>
                <option value="car_petrol">Car - Petrol</option>
                <option value="car_pluginhybrid">Car - Plug in Hybrid</option>
                <option value="taxi">Taxi</option>
                <option value="taxi_blackcab">Taxi - Black Cab</option>
                <option value="Train">Train</option>
                <option value="Train_underground">Train - Underground</option>
                <option value="Bike">Bike</option>
                <option value="Walk">Walk</option>
              </select>
            </div>

            {/* Visualize button */}
            <button onClick={handleVisualize} disabled={isLoading} className="btn btn-primary w-full">
              {isLoading ? "Calculating..." : "Visualize My Commute Impact"}
            </button>

            {/* Error message display */}
            {error && (
              <div className="alert alert-error">
                <p>{error}</p>
              </div>
            )}
          </>
        )}

        {/* Tree Visualization - shown when calculation is complete */}
        {carbonEmissions !== null && (
          <div className="bg-success/10 p-6 rounded-lg relative">
            {/* Heading showing number of trees needed */}
            <h3 className="text-xl font-semibold mb-4 text-center">
              {treesNeeded.toLocaleString()} trees needed to offset {isSharedView ? "this" : "your"} annual commute
            </h3>

            {/* Carbon emissions information */}
            <p className="text-center mb-4 text-sm text-base-content/70">
              {isSharedView ? "This" : "Your"} one-way commute produces approximately {carbonEmissions.toFixed(2)} kg of
              CO₂
            </p>

            {/* Visual representation of trees */}
            <div className="flex flex-wrap justify-center gap-2">
              {/* Display up to 100 tree icons */}
              {Array.from({ length: Math.min(treesNeeded, 100) }).map((_, i) => (
                <Tree
                  key={i}
                  className={`h-8 w-8 ${
                    i < treesNeeded / 3 ? "text-success" : i < treesNeeded / 2 ? "text-success/80" : "text-success/60"
                  }`}
                />
              ))}

              {/* If more than 100 trees, show a message for the remaining */}
              {treesNeeded > 100 && (
                <div className="flex items-center justify-center w-full mt-2">
                  <span className="text-sm text-base-content/70">
                    + {(treesNeeded - 100).toLocaleString()} more trees
                  </span>
                </div>
              )}
            </div>

            {/* Share button - only shown if not in shared view */}
            {!isSharedView && (
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  {/* Share button with icon */}
                  <button className="btn btn-success flex items-center" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share this result
                  </button>

                  {/* Tooltip that appears when copying link */}
                  {showTooltip && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-neutral text-neutral-content text-sm rounded-md whitespace-nowrap">
                      {shareTooltip}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Button to calculate your own commute - only shown in shared view */}
        {isSharedView && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Reset the shared view state and clear URL parameters
                window.history.pushState({}, "", window.location.pathname)
                setIsSharedView(false)
              }}
              className="btn btn-primary"
            >
              Calculate your own commute
            </button>
          </div>
        )}

        {/* Company CTA Component - shown after calculation */}
        {carbonEmissions !== null && (
          <div className="card w-full max-w-3xl mx-auto mt-8 mb-8 p-6 bg-base-100 shadow-sm">
            {/* CTA heading */}
            <h2 className="text-xl font-bold text-base-content mb-2">
              Want to reduce your company's commuting emissions?
            </h2>

            {/* CTA description */}
            <p className="mb-4 text-base-content/80">
              Our platform helps businesses track, report, and reduce their carbon footprint from employee commuting.
            </p>

            {/* Email submission form */}
            <form onSubmit={handleRequestInfo} className="mt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  {/* Email input field */}
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    className="input input-bordered w-full"
                    disabled={isSubmitting}
                  />

                  {/* Error message display */}
                  {submitStatus === "error" && <p className="mt-1 text-error text-sm">{errorMessage}</p>}

                  {/* Success message display */}
                  {submitStatus === "success" && (
                    <p className="mt-1 text-success text-md font-semibold">Thank you! We'll be in touch soon.</p>
                  )}
                </div>

                {/* Submit button */}
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Sending..." : "Request More Information"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Information cards at the bottom */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* What does this mean card */}
          <div className="bg-base-200 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-base-content">What does this mean?</h4>
            <p className="text-sm text-base-content/70">
              A single tree absorbs approximately 25kg of CO₂ per year. This visualization shows how many trees would be
              needed to completely offset an annual commuting carbon footprint, assuming commuting 230 days per year.
            </p>
          </div>

          {/* Reducing commute impact card */}
          <div className="bg-base-200 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-base-content">Reducing commute impact</h4>
            <p className="text-sm text-base-content/70">
              Consider carpooling, using public transport, cycling, or walking when possible. Remote work even one day
              per week can reduce commuting emissions by 20%.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

