import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import Header from '../components/header';
import '../styles/ProductList.css';

const InventoryList = () => {
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newItem, setNewItem] = useState({
        nParte: '',
        descripcion: '',
        serial: '',
        tipo: 'HW',
        cliente: '',
        oc: '',
        status: 'Por entregar',
        facturado: false,
        numeroFactura: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalItems: 0
    });
    const [filters, setFilters] = useState({
        nParte: '',
        descripcion: '',
        serial: '',
        tipo: '',
        cliente: '',
        oc: '',
        status: '',
        facturado: '',
        numeroFactura: ''
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const navigate = useNavigate();

    // Obtener usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.nombre : 'Usuario';

    // Debounce para filtros de texto
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 500);

        return () => clearTimeout(handler);
    }, [filters]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchItems();
    }, [navigate, pagination.page, debouncedFilters]);

    const fetchItems = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page: pagination.page,
                limit: 10
            };

            // Añadir filtros con formato correcto
            Object.entries(debouncedFilters).forEach(([key, value]) => {
                if (value !== '') {
                    if (['nParte', 'descripcion', 'serial', 'cliente', 'oc', 'numeroFactura'].includes(key)) {
                        params[`${key}[regex]`] = value;
                        params[`${key}[options]`] = 'i';
                    } else {
                        params[key] = value;
                    }
                }
            });

            const res = await axios.get('http://localhost:5000/api/inventory', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (res.data && Array.isArray(res.data.items)) {
                setItems(res.data.items);
                setPagination({
                    page: res.data.currentPage,
                    totalPages: res.data.totalPages,
                    totalItems: res.data.totalItems
                });
            }
        } catch (err) {
            console.error('Error al obtener items:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetFilters = () => {
        setFilters({
            nParte: '',
            descripcion: '',
            serial: '',
            tipo: '',
            cliente: '',
            oc: '',
            status: '',
            facturado: '',
            numeroFactura: ''
        });
    };

    const handleEdit = (item) => {
        setEditingId(item._id);
        setEditForm({
            nParte: item.nParte,
            descripcion: item.descripcion,
            serial: item.serial,
            tipo: item.tipo,
            cliente: item.cliente,
            oc: item.oc,
            status: item.status,
            facturado: item.facturado,
            numeroFactura: item.numeroFactura || ''
        });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUpdate = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:5000/api/inventory/${id}`,
                editForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setItems(prev => prev.map(item => 
                item._id === id ? response.data : item
            ));
            setEditingId(null);
        } catch (err) {
            console.error('Error al actualizar:', err);
            alert(err.response?.data?.error || 'Error al actualizar item');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este registro?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/inventory/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchItems();
            } catch (err) {
                console.error('Error al eliminar:', err);
                alert(err.response?.data?.error || 'Error al eliminar item');
            }
        }
    };

    const handleNewItemChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddItem = async () => {
        if (!newItem.nParte || !newItem.serial || !newItem.cliente || !newItem.oc) {
            alert('N° Parte, Serial, Cliente y OC son campos requeridos');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/inventory', newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewItem({
                nParte: '',
                descripcion: '',
                serial: '',
                tipo: 'HW',
                cliente: '',
                oc: '',
                status: 'Por entregar',
                facturado: false,
                numeroFactura: ''
            });
            fetchItems();
        } catch (err) {
            console.error('Error al agregar:', err);
            alert(err.response?.data?.error || 'Error al crear item');
        }
    };

    const exportToCSV = () => {
        setIsLoading(true);
        const headers = ['N° Parte', 'Descripción', 'Serial', 'Tipo', 'Cliente', 'OC', 'Status', 'Facturado', 'N° Factura'];
        const data = items.map(item => [
            item.nParte,
            item.descripcion || '',
            item.serial,
            item.tipo,
            item.cliente,
            item.oc,
            item.status,
            item.facturado ? 'Sí' : 'No',
            item.numeroFactura || ''
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(',') + '\n' 
            + data.map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'inventario.csv');
        setIsLoading(false);
    };

    return (
        <div className="product-list-container">
            <Header userName={userName} />

            <div className="add-product-form">
                <h3>Agregar Nuevo Item</h3>
                <div className="form-row">
                    <input
                        type="text"
                        name="nParte"
                        placeholder="N° Parte*"
                        value={newItem.nParte}
                        onChange={handleNewItemChange}
                        required
                    />
                    <input
                        type="text"
                        name="serial"
                        placeholder="Serial*"
                        value={newItem.serial}
                        onChange={handleNewItemChange}
                        required
                    />
                </div>
                <div className="form-row">
                    <input
                        type="text"
                        name="descripcion"
                        placeholder="Descripción"
                        value={newItem.descripcion}
                        onChange={handleNewItemChange}
                    />
                    <select
                        name="tipo"
                        value={newItem.tipo}
                        onChange={handleNewItemChange}
                    >
                        <option value="HW">Hardware (HW)</option>
                        <option value="SW">Software (SW)</option>
                    </select>
                </div>
                <div className="form-row">
                    <input
                        type="text"
                        name="cliente"
                        placeholder="Cliente*"
                        value={newItem.cliente}
                        onChange={handleNewItemChange}
                        required
                    />
                    <input
                        type="text"
                        name="oc"
                        placeholder="OC*"
                        value={newItem.oc}
                        onChange={handleNewItemChange}
                        required
                    />
                </div>
                <div className="form-row">
                    <select
                        name="status"
                        value={newItem.status}
                        onChange={handleNewItemChange}
                    >
                        <option value="Por entregar">Por entregar</option>
                        <option value="En progreso">En progreso</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                    </select>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="facturado"
                            checked={newItem.facturado}
                            onChange={handleNewItemChange}
                        />
                        Facturado
                    </label>
                    {newItem.facturado && (
                        <input
                            type="text"
                            name="numeroFactura"
                            placeholder="N° Factura"
                            value={newItem.numeroFactura}
                            onChange={handleNewItemChange}
                        />
                    )}
                    <button onClick={handleAddItem}>Agregar</button>
                </div>
            </div>

            <div className="table-container">
                <div className="table-actions">
                    <button 
                        onClick={exportToCSV} 
                        disabled={isLoading || items.length === 0}
                    >
                        {isLoading ? 'Exportando...' : 'Exportar a CSV'}
                    </button>
                    <button 
                        onClick={resetFilters} 
                        className="reset-filters"
                        disabled={Object.values(filters).every(val => val === '')}
                    >
                        Limpiar Filtros
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>N° Parte</th>
                            <th>Descripción</th>
                            <th>Serial</th>
                            <th>Tipo</th>
                            <th>Cliente</th>
                            <th>OC</th>
                            <th>Status</th>
                            <th>Facturado</th>
                            <th>N° Factura</th>
                            <th>Acciones</th>
                        </tr>
                        <tr className="filter-row">
                            <td>
                                <input
                                    type="text"
                                    name="nParte"
                                    placeholder="Filtrar..."
                                    value={filters.nParte}
                                    onChange={handleFilterChange}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="descripcion"
                                    placeholder="Filtrar..."
                                    value={filters.descripcion}
                                    onChange={handleFilterChange}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="serial"
                                    placeholder="Filtrar..."
                                    value={filters.serial}
                                    onChange={handleFilterChange}
                                />
                            </td>
                            <td>
                                <select
                                    name="tipo"
                                    value={filters.tipo}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos</option>
                                    <option value="HW">HW</option>
                                    <option value="SW">SW</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="cliente"
                                    placeholder="Filtrar..."
                                    value={filters.cliente}
                                    onChange={handleFilterChange}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="oc"
                                    placeholder="Filtrar..."
                                    value={filters.oc}
                                    onChange={handleFilterChange}
                                />
                            </td>
                            <td>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos</option>
                                    <option value="Por entregar">Por entregar</option>
                                    <option value="En progreso">En progreso</option>
                                    <option value="Enviado">Enviado</option>
                                    <option value="Entregado">Entregado</option>
                                </select>
                            </td>
                            <td>
                                <select
                                    name="facturado"
                                    value={filters.facturado}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Sí</option>
                                    <option value="false">No</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="numeroFactura"
                                    placeholder="Filtrar..."
                                    value={filters.numeroFactura}
                                    onChange={handleFilterChange}
                                />
                            </td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map(item => (
                                <tr key={item._id}>
                                    {editingId === item._id ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="nParte"
                                                    value={editForm.nParte}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="descripcion"
                                                    value={editForm.descripcion}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="serial"
                                                    value={editForm.serial}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    name="tipo"
                                                    value={editForm.tipo}
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="HW">HW</option>
                                                    <option value="SW">SW</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="cliente"
                                                    value={editForm.cliente}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="oc"
                                                    value={editForm.oc}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    name="status"
                                                    value={editForm.status}
                                                    onChange={handleEditChange}
                                                >
                                                    <option value="Por entregar">Por entregar</option>
                                                    <option value="En progreso">En progreso</option>
                                                    <option value="Enviado">Enviado</option>
                                                    <option value="Entregado">Entregado</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    name="facturado"
                                                    checked={editForm.facturado}
                                                    onChange={handleEditChange}
                                                />
                                            </td>
                                            <td>
                                                {editForm.facturado && (
                                                    <input
                                                        type="text"
                                                        name="numeroFactura"
                                                        value={editForm.numeroFactura}
                                                        onChange={handleEditChange}
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                <button onClick={() => handleUpdate(item._id)}>Guardar</button>
                                                <button onClick={() => setEditingId(null)}>Cancelar</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{item.nParte}</td>
                                            <td>{item.descripcion || '-'}</td>
                                            <td>{item.serial}</td>
                                            <td>{item.tipo}</td>
                                            <td>{item.cliente}</td>
                                            <td>{item.oc}</td>
                                            <td>{item.status}</td>
                                            <td>{item.facturado ? 'Sí' : 'No'}</td>
                                            <td>{item.numeroFactura || '-'}</td>
                                            <td>
                                                <button onClick={() => handleEdit(item)}>Editar</button>
                                                <button onClick={() => handleDelete(item._id)}>Eliminar</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className="no-products">
                                    {isLoading ? 'Cargando...' : 'No hay items disponibles'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page <= 1 || isLoading}
                        >
                            Anterior
                        </button>
                        <span>Página {pagination.page} de {pagination.totalPages}</span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages || isLoading}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryList;