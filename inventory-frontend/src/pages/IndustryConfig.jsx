import React, { useState, useEffect } from 'react';
import { industryConfigService } from '../services/api';
import { FaPills, FaTshirt, FaIndustry, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const IndustryConfig = () => {
  const [loading, setLoading] = useState(true);
  const [industryTypes, setIndustryTypes] = useState([]);
  const [features, setFeatures] = useState({});
  const [summary, setSummary] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('PHARMACY');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typesData, summaryData] = await Promise.all([
        industryConfigService.getTypes(),
        industryConfigService.getSummary()
      ]);
      setIndustryTypes(Array.isArray(typesData) ? typesData : (typesData?.content ?? typesData?.data ?? []));
      setSummary(summaryData);

      // Fetch features for the selected industry
      if (selectedIndustry) {
        const featuresData = await industryConfigService.getFeatures(selectedIndustry);
        const fList = Array.isArray(featuresData) ? featuresData : (featuresData?.content ?? featuresData?.data ?? []);
        setFeatures({ ...features, [selectedIndustry]: fList });
      }
    } catch (error) {
      console.error('Error fetching industry configuration:', error);
      alert('Failed to load industry configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleIndustryChange = async (type) => {
    setSelectedIndustry(type);

    // Fetch features if not already loaded
    if (!features[type]) {
      try {
        const featuresData = await industryConfigService.getFeatures(type);
        const fList = Array.isArray(featuresData) ? featuresData : (featuresData?.content ?? featuresData?.data ?? []);
        setFeatures({ ...features, [type]: fList });
      } catch (error) {
        console.error('Error fetching features for', type, error);
      }
    }
  };

  const getIndustryIcon = (type) => {
    switch (type) {
      case 'PHARMACY':
        return <FaPills />;
      case 'RETAIL':
        return <FaTshirt />;
      case 'MANUFACTURING':
        return <FaIndustry />;
      default:
        return null;
    }
  };

  const getIndustryColor = (type) => {
    switch (type) {
      case 'PHARMACY':
        return '#3b82f6'; // blue
      case 'RETAIL':
        return '#10b981'; // green
      case 'MANUFACTURING':
        return '#f59e0b'; // orange
      default:
        return '#6b7280'; // gray
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Industry Configuration</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading industry configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Industry Configuration</h1>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
          View and manage industry-specific features
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ borderLeft: `4px solid #3b82f6` }}>
            <div className="stat-title">Total Industries</div>
            <div className="stat-value">{summary.totalIndustries || 0}</div>
            <div className="stat-subtitle">Available industry types</div>
          </div>

          <div className="stat-card" style={{ borderLeft: `4px solid #10b981` }}>
            <div className="stat-title">Total Features</div>
            <div className="stat-value">{summary.totalFeatures || 0}</div>
            <div className="stat-subtitle">Across all industries</div>
          </div>

          <div className="stat-card" style={{ borderLeft: `4px solid #f59e0b` }}>
            <div className="stat-title">Active Features</div>
            <div className="stat-value">{summary.activeFeatures || 0}</div>
            <div className="stat-subtitle">Currently enabled</div>
          </div>

          <div className="stat-card" style={{ borderLeft: `4px solid #8b5cf6` }}>
            <div className="stat-title">Industry Products</div>
            <div className="stat-value">{summary.industryProductCount || 0}</div>
            <div className="stat-subtitle">Industry-specific products</div>
          </div>
        </div>
      )}

      {/* Industry Type Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Industry Types</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {industryTypes.map((type) => (
            <div
              key={type}
              onClick={() => handleIndustryChange(type)}
              style={{
                padding: '1.5rem',
                backgroundColor: selectedIndustry === type ? '#1f2937' : '#111827',
                border: `2px solid ${selectedIndustry === type ? getIndustryColor(type) : '#374151'}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedIndustry !== type) {
                  e.currentTarget.style.borderColor = getIndustryColor(type);
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIndustry !== type) {
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.backgroundColor = '#111827';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '2rem', color: getIndustryColor(type) }}>
                  {getIndustryIcon(type)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                    {type}
                  </h3>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>
                    {summary?.industryFeatureCounts?.[type] || 0} features
                  </p>
                </div>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {type === 'PHARMACY' && 'Batch tracking, expiry dates, prescription management, cold chain monitoring'}
                {type === 'RETAIL' && 'Size/color variants, seasonal tracking, promotions, display features'}
                {type === 'MANUFACTURING' && 'Raw materials, WIP tracking, production lines, quality inspections'}
              </p>
              {selectedIndustry === type && (
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: getIndustryColor(type),
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                }}>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features List */}
      {selectedIndustry && features[selectedIndustry] && (
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            {selectedIndustry} Features
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Feature Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Available Since</th>
                </tr>
              </thead>
              <tbody>
                {features[selectedIndustry].length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                      No features configured for {selectedIndustry}
                    </td>
                  </tr>
                ) : (
                  features[selectedIndustry].map((feature, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {feature.name || feature.featureKey}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: '#9ca3af' }}>
                          {feature.description || 'No description available'}
                        </div>
                      </td>
                      <td>
                        {feature.enabled ? (
                          <span className="badge" style={{ backgroundColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaCheckCircle /> Enabled
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaTimesCircle /> Disabled
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          {feature.version || 'v1.0'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Descriptions */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#1f2937', borderRadius: '0.5rem', border: '1px solid #374151' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          Feature Descriptions
        </h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {selectedIndustry === 'PHARMACY' && (
            <>
              <FeatureDescription
                title="Batch Tracking"
                description="Track pharmaceutical products by batch/lot number for compliance and recall management"
              />
              <FeatureDescription
                title="Expiry Date Management"
                description="Monitor product expiry dates with automated alerts for expiring and expired medications"
              />
              <FeatureDescription
                title="Prescription Management"
                description="Manage prescription-only medications with DEA schedule tracking and controlled substance monitoring"
              />
              <FeatureDescription
                title="Cold Chain Monitoring"
                description="Track refrigerated products with storage temperature requirements and compliance alerts"
              />
            </>
          )}

          {selectedIndustry === 'RETAIL' && (
            <>
              <FeatureDescription
                title="Variant Management"
                description="Manage product variants by size, color, and style with parent-child SKU relationships"
              />
              <FeatureDescription
                title="Seasonal Tracking"
                description="Track seasonal collections (Spring, Summer, Fall, Winter) with automated clearance marking"
              />
              <FeatureDescription
                title="Promotions"
                description="Apply sales, discounts, and promotional pricing with MSRP comparison"
              />
              <FeatureDescription
                title="Display Features"
                description="Mark products as featured, bestsellers, or new arrivals for merchandising"
              />
            </>
          )}

          {selectedIndustry === 'MANUFACTURING' && (
            <>
              <FeatureDescription
                title="WIP Tracking"
                description="Track work-in-progress by work order, production line, and completion percentage"
              />
              <FeatureDescription
                title="Production Line Management"
                description="Manage products across multiple production lines with real-time status updates"
              />
              <FeatureDescription
                title="Quality Inspection"
                description="Conduct quality inspections with pass/fail grades, defect tracking, and inspector notes"
              />
              <FeatureDescription
                title="Rework Tracking"
                description="Track rework, rejected, and scrapped products with reason codes and cost analysis"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const FeatureDescription = ({ title, description }) => (
  <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #374151' }}>
    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{title}</div>
    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{description}</div>
  </div>
);

export default IndustryConfig;
