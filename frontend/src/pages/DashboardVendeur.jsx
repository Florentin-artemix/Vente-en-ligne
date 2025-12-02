import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { produitService } from '../services/api';
import './Dashboard.css';

const DashboardVendeur = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [newProduit, setNewProduit] = useState({
    titre: '',
    description: '',
    prix: '',
    categorie: '',
    sousCategorie: '',
    marque: '',
    stock: '',
    imageUrl: '',
    currency: 'USD',
    imageFile: null,
    specifications: {}
  });
  
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [editSpecKey, setEditSpecKey] = useState('');
  const [editSpecValue, setEditSpecValue] = useState('');

  const addSpecification = (isEdit = false) => {
    const key = isEdit ? editSpecKey : newSpecKey;
    const value = isEdit ? editSpecValue : newSpecValue;
    
    if (key.trim() && value.trim()) {
      if (isEdit) {
        setSelectedProduit({
          ...selectedProduit,
          specifications: {
            ...(selectedProduit.specifications || {}),
            [key.trim()]: value.trim()
          }
        });
        setEditSpecKey('');
        setEditSpecValue('');
      } else {
        setNewProduit({
          ...newProduit,
          specifications: {
            ...newProduit.specifications,
            [key.trim()]: value.trim()
          }
        });
        setNewSpecKey('');
        setNewSpecValue('');
      }
    }
  };

  const removeSpecification = (keyToRemove, isEdit = false) => {
    if (isEdit) {
      const newSpecs = { ...(selectedProduit.specifications || {}) };
      delete newSpecs[keyToRemove];
      setSelectedProduit({ ...selectedProduit, specifications: newSpecs });
    } else {
      const newSpecs = { ...newProduit.specifications };
      delete newSpecs[keyToRemove];
      setNewProduit({ ...newProduit, specifications: newSpecs });
    }
  };

  useEffect(() => {
    loadProduits();
  }, [userProfile]);

  const loadProduits = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    try {
      const data = await produitService.getProduitsByVendeur(userProfile.id);
      setProduits(data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des produits' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddProduit = async (e) => {
    e.preventDefault();
    try {
      const produitData = {
        titre: newProduit.titre,
        description: newProduit.description,
        prix: parseFloat(newProduit.prix),
        currency: newProduit.currency,
        categorie: newProduit.categorie,
        sousCategorie: newProduit.sousCategorie,
        marque: newProduit.marque,
        stock: parseInt(newProduit.stock),
        imageUrl: newProduit.imageUrl,
        vendeurId: userProfile.id,
        status: 'DISPONIBLE',
        specifications: newProduit.specifications
      };
      
      await produitService.createProduit(produitData);
      setMessage({ type: 'success', text: 'Produit ajouté avec succès!' });
      setShowAddModal(false);
      setNewProduit({
        titre: '',
        description: '',
        prix: '',
        categorie: '',
        sousCategorie: '',
        marque: '',
        stock: '',
        imageUrl: '',
        currency: 'USD',
        imageFile: null,
        specifications: {}
      });
      loadProduits();
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout du produit' });
    }
  };

  const handleUpdateProduit = async (e) => {
    e.preventDefault();
    try {
      await produitService.updateProduit(selectedProduit.id, selectedProduit);
      setMessage({ type: 'success', text: 'Produit mis à jour!' });
      setShowEditModal(false);
      loadProduits();
    } catch (error) {
      console.error('Erreur modification produit:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la modification' });
    }
  };

  const handleDeleteProduit = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce produit?')) {
      try {
        await produitService.deleteProduit(id);
        setMessage({ type: 'success', text: 'Produit supprimé!' });
        loadProduits();
      } catch (error) {
        console.error('Erreur suppression produit:', error);
        setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
      }
    }
  };

  const handleEditClick = (produit) => {
    setSelectedProduit({ ...produit });
    setShowEditModal(true);
  };

  return (
    <div className="dashboard-container vendeur">
      <header className="dashboard-header">
        <h1>🏪 Espace Vendeur</h1>
        <button onClick={handleLogout} className="logout-btn">
          Déconnexion
        </button>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-card">
          <div className="welcome-avatar">
            {userProfile?.photoProfil ? (
              <img src={userProfile.photoProfil} alt="Profile" />
            ) : (
              <div className="avatar-placeholder vendeur">
                {userProfile?.prenom?.charAt(0)}{userProfile?.nom?.charAt(0)}
              </div>
            )}
          </div>
          <div className="welcome-info">
            <h2>Bonjour {userProfile?.prenom} {userProfile?.nom}!</h2>
            <p className="role-badge vendeur">Je suis {userProfile?.role}</p>
            <p className="email">{userProfile?.email}</p>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>📦 Total Produits</h3>
            <p className="stat-number">{produits.length}</p>
          </div>
          <div className="stat-card">
            <h3>✅ Disponibles</h3>
            <p className="stat-number">{produits.filter(p => p.status === 'DISPONIBLE').length}</p>
          </div>
          <div className="stat-card">
            <h3>⚠️ Rupture</h3>
            <p className="stat-number">{produits.filter(p => p.status === 'RUPTURE_STOCK').length}</p>
          </div>
        </div>

        <div className="products-section">
          <div className="section-header">
            <h3>📦 Mes Produits</h3>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              ➕ Ajouter un Produit
            </button>
          </div>

          {loading ? (
            <div className="loading">Chargement...</div>
          ) : produits.length === 0 ? (
            <div className="empty-state">
              <p>Vous n'avez pas encore de produits.</p>
              <button onClick={() => setShowAddModal(true)}>Ajouter votre premier produit</button>
            </div>
          ) : (
            <div className="products-grid">
              {produits.map(produit => (
                <div key={produit.id} className="product-card">
                  <div className="product-image">
                    {produit.imageUrl ? (
                      <img src={produit.imageUrl} alt={produit.titre} />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h4>{produit.titre}</h4>
                    <p className="product-price">{produit.prix} {produit.currency}</p>
                    <p className="product-stock">Stock: {produit.stock}</p>
                    <span className={`status-badge ${produit.status?.toLowerCase()}`}>
                      {produit.status}
                    </span>
                  </div>
                  <div className="product-actions">
                    <button className="edit-btn" onClick={() => handleEditClick(produit)}>✏️</button>
                    <button className="delete-btn" onClick={() => handleDeleteProduit(produit.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Ajouter Produit */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>➕ Ajouter un Produit</h2>
            <form onSubmit={handleAddProduit}>
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={newProduit.titre}
                  onChange={e => setNewProduit({...newProduit, titre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProduit.description}
                  onChange={e => setNewProduit({...newProduit, description: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduit.prix}
                    onChange={e => setNewProduit({...newProduit, prix: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select
                    value={newProduit.currency}
                    onChange={e => setNewProduit({...newProduit, currency: e.target.value})}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie *</label>
                  <input
                    type="text"
                    value={newProduit.categorie}
                    onChange={e => setNewProduit({...newProduit, categorie: e.target.value})}
                    placeholder="Ex: Électronique, Vêtements..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sous-catégorie</label>
                  <input
                    type="text"
                    value={newProduit.sousCategorie}
                    onChange={e => setNewProduit({...newProduit, sousCategorie: e.target.value})}
                    placeholder="Ex: Smartphones, T-shirts..."
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Marque</label>
                  <input
                    type="text"
                    value={newProduit.marque}
                    onChange={e => setNewProduit({...newProduit, marque: e.target.value})}
                    placeholder="Ex: Samsung, Nike..."
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={newProduit.stock}
                    onChange={e => setNewProduit({...newProduit, stock: e.target.value})}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="text"
                  value={newProduit.imageUrl}
                  onChange={e => setNewProduit({...newProduit, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              
              {/* Spécifications */}
              <div className="form-group specifications-section">
                <label>📋 Spécifications (optionnel)</label>
                <div className="specs-input-row">
                  <input
                    type="text"
                    placeholder="Nom (ex: Couleur, Taille, Poids...)"
                    value={newSpecKey}
                    onChange={e => setNewSpecKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Valeur (ex: Rouge, XL, 500g...)"
                    value={newSpecValue}
                    onChange={e => setNewSpecValue(e.target.value)}
                  />
                  <button type="button" className="add-spec-btn" onClick={() => addSpecification(false)}>
                    ➕
                  </button>
                </div>
                {Object.keys(newProduit.specifications).length > 0 && (
                  <div className="specs-list">
                    {Object.entries(newProduit.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <span className="spec-key">{key}:</span>
                        <span className="spec-value">{value}</span>
                        <button type="button" className="remove-spec-btn" onClick={() => removeSpecification(key, false)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="submit-btn">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier Produit */}
      {showEditModal && selectedProduit && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>✏️ Modifier le Produit</h2>
            <form onSubmit={handleUpdateProduit}>
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={selectedProduit.titre}
                  onChange={e => setSelectedProduit({...selectedProduit, titre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={selectedProduit.description || ''}
                  onChange={e => setSelectedProduit({...selectedProduit, description: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedProduit.prix}
                    onChange={e => setSelectedProduit({...selectedProduit, prix: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select
                    value={selectedProduit.currency || 'USD'}
                    onChange={e => setSelectedProduit({...selectedProduit, currency: e.target.value})}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie</label>
                  <input
                    type="text"
                    value={selectedProduit.categorie || ''}
                    onChange={e => setSelectedProduit({...selectedProduit, categorie: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Sous-catégorie</label>
                  <input
                    type="text"
                    value={selectedProduit.sousCategorie || ''}
                    onChange={e => setSelectedProduit({...selectedProduit, sousCategorie: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Marque</label>
                  <input
                    type="text"
                    value={selectedProduit.marque || ''}
                    onChange={e => setSelectedProduit({...selectedProduit, marque: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={selectedProduit.stock}
                    onChange={e => setSelectedProduit({...selectedProduit, stock: parseInt(e.target.value)})}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  value={selectedProduit.imageUrl || selectedProduit.image || ''}
                  onChange={e => setSelectedProduit({...selectedProduit, imageUrl: e.target.value, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={selectedProduit.status}
                  onChange={e => setSelectedProduit({...selectedProduit, status: e.target.value})}
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="RUPTURE_STOCK">Rupture de Stock</option>
                  <option value="EN_PROMOTION">En Promotion</option>
                  <option value="DESACTIVE">Désactivé</option>
                </select>
              </div>
              
              {/* Spécifications pour modification */}
              <div className="form-group specifications-section">
                <label>📋 Spécifications</label>
                <div className="specs-input-row">
                  <input
                    type="text"
                    placeholder="Nom (ex: Couleur, Taille...)"
                    value={editSpecKey}
                    onChange={e => setEditSpecKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Valeur (ex: Rouge, XL...)"
                    value={editSpecValue}
                    onChange={e => setEditSpecValue(e.target.value)}
                  />
                  <button type="button" className="add-spec-btn" onClick={() => addSpecification(true)}>
                    ➕
                  </button>
                </div>
                {selectedProduit.specifications && Object.keys(selectedProduit.specifications).length > 0 && (
                  <div className="specs-list">
                    {Object.entries(selectedProduit.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <span className="spec-key">{key}:</span>
                        <span className="spec-value">{value}</span>
                        <button type="button" className="remove-spec-btn" onClick={() => removeSpecification(key, true)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>Annuler</button>
                <button type="submit" className="submit-btn">Mettre à jour</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardVendeur;
