'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Mock data for search results
const mockData = {
  inspections: [
    { id: 'INS-001', title: 'Site Inspection #001', subtitle: '123 Green Street, Eco City', icon: 'bi-clipboard-check' },
    { id: 'INS-002', title: 'Environmental Audit', subtitle: '456 Nature Avenue, Bio Town', icon: 'bi-clipboard-check' },
  ],
  projects: [
    { id: 'PRJ-001', title: 'Green Valley Project', subtitle: 'Environmental Impact Study', icon: 'bi-tree' },
    { id: 'PRJ-002', title: 'Eco City Initiative', subtitle: 'Sustainability Assessment', icon: 'bi-tree' },
  ],
  clients: [
    { id: 'CLT-001', title: 'Eco Solutions Inc.', subtitle: 'Environmental Consulting', icon: 'bi-building' },
    { id: 'CLT-002', title: 'Green Earth Corp', subtitle: 'Sustainable Development', icon: 'bi-building' },
  ],
};

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    inspections: any[];
    projects: any[];
    clients: any[];
  }>({
    inspections: [],
    projects: [],
    clients: [],
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      // Filter results based on query
      const filteredResults = {
        inspections: mockData.inspections.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
        ),
        projects: mockData.projects.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
        ),
        clients: mockData.clients.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
        ),
      };
      setResults(filteredResults);
    } else {
      setResults({
        inspections: [],
        projects: [],
        clients: [],
      });
    }
  }, [query]);

  const handleResultClick = (type: string, id: string) => {
    onClose();
    router.push(`/${type}/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-overlay-backdrop" onClick={onClose} />
      <div className="search-overlay-content">
        <div className="search-header">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control border-start-0"
              placeholder="Search inspections, projects, or clients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary border-start-0"
              onClick={onClose}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div className="search-results">
          {results.inspections.length > 0 && (
            <div className="result-section">
              <h6 className="result-section-title">
                <i className="bi bi-clipboard-check me-2"></i>
                Inspections
              </h6>
              {results.inspections.map((item) => (
                <div
                  key={item.id}
                  className="result-item"
                  onClick={() => handleResultClick('inspection', item.id)}
                >
                  <i className={`bi ${item.icon} result-icon`}></i>
                  <div className="result-content">
                    <div className="result-title">{item.title}</div>
                    <div className="result-subtitle">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.projects.length > 0 && (
            <div className="result-section">
              <h6 className="result-section-title">
                <i className="bi bi-tree me-2"></i>
                Projects
              </h6>
              {results.projects.map((item) => (
                <div
                  key={item.id}
                  className="result-item"
                  onClick={() => handleResultClick('project', item.id)}
                >
                  <i className={`bi ${item.icon} result-icon`}></i>
                  <div className="result-content">
                    <div className="result-title">{item.title}</div>
                    <div className="result-subtitle">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.clients.length > 0 && (
            <div className="result-section">
              <h6 className="result-section-title">
                <i className="bi bi-building me-2"></i>
                Clients
              </h6>
              {results.clients.map((item) => (
                <div
                  key={item.id}
                  className="result-item"
                  onClick={() => handleResultClick('client', item.id)}
                >
                  <i className={`bi ${item.icon} result-icon`}></i>
                  <div className="result-content">
                    <div className="result-title">{item.title}</div>
                    <div className="result-subtitle">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {query && results.inspections.length === 0 && results.projects.length === 0 && results.clients.length === 0 && (
            <div className="no-results">
              <i className="bi bi-search me-2"></i>
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 