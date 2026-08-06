import { useEffect, useState, useRef } from 'react';
import { useWebSectionStore, WebSection } from '../store/webSectionStore';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Save, X } from 'lucide-react';

export default function WebAdminScreen() {
    const { sections, fetchSections, createSection, updateSection, deleteSection, updateOrder, isLoading } = useWebSectionStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<WebSection | null>(null);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sectionType, setSectionType] = useState('HERO');
    const [isActive, setIsActive] = useState(true);
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [carouselImages, setCarouselImages] = useState<File[]>([]);
    
    const mainImageRef = useRef<HTMLInputElement>(null);
    const carouselImagesRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const openModal = (section?: WebSection) => {
        if (section) {
            setEditingSection(section);
            setTitle(section.title);
            setDescription(section.description || '');
            setSectionType(section.sectionType);
            setIsActive(section.isActive);
        } else {
            setEditingSection(null);
            setTitle('');
            setDescription('');
            setSectionType('HERO');
            setIsActive(true);
        }
        setMainImage(null);
        setCarouselImages([]);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!title || !sectionType) return alert('El título y tipo son requeridos');

        const formData = new FormData();
        const data = { title, description, sectionType, isActive };
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        
        if (mainImage) formData.append('mainImage', mainImage);
        carouselImages.forEach(file => formData.append('carouselImages', file));

        const success = editingSection 
            ? await updateSection(editingSection.id, formData)
            : await createSection(formData);
            
        if (success) setIsModalOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Eliminar esta sección?')) {
            await deleteSection(id);
        }
    };

    const moveSection = async (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= sections.length) return;
        const newSections = [...sections];
        const temp = newSections[index];
        newSections[index] = newSections[index + direction];
        newSections[index + direction] = temp;
        
        const orderedIds = newSections.map(s => s.id);
        await updateOrder(orderedIds);
        fetchSections(); // Reload to get new order
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Administración Web</h1>
                    <p className="page-subtitle">Gestiona el contenido de tu landing page</p>
                </div>
                <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Añadir Sección
                </button>
            </div>

            {isLoading && !isModalOpen ? <p>Cargando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sections.map((section, index) => (
                        <div key={section.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <button onClick={() => moveSection(index, -1)} disabled={index === 0} style={{ border: 'none', background: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}><ArrowUp size={16} /></button>
                                    <button onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} style={{ border: 'none', background: 'none', cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}><ArrowDown size={16} /></button>
                                </div>
                                {section.imageUrl ? (
                                    <img src={section.imageUrl} alt="preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                ) : (
                                    <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImageIcon size={24} color="var(--text-muted)" />
                                    </div>
                                )}
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{section.title}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tipo: {section.sectionType} | Estado: {section.isActive ? 'Activo' : 'Oculto'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-outline" onClick={() => openModal(section)} style={{ padding: '6px' }}><Edit2 size={16} /></button>
                                <button className="btn-outline" onClick={() => handleDelete(section.id)} style={{ padding: '6px', color: 'var(--primary)', borderColor: 'var(--primary)' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {sections.length === 0 && (
                        <div className="card text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                            No hay secciones configuradas. Añade una para empezar.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2>{editingSection ? 'Editar Sección' : 'Nueva Sección'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Título de la Sección *</label>
                                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Nuestro Equipo" />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tipo de Sección *</label>
                                <select className="form-input" value={sectionType} onChange={e => setSectionType(e.target.value)}>
                                    <option value="HERO">Hero (Portada Principal)</option>
                                    <option value="TEXT_IMAGE">Texto + Imagen</option>
                                    <option value="CAROUSEL">Carrusel de Imágenes</option>
                                    <option value="TEXT_ONLY">Solo Texto / Precios</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Descripción</label>
                                <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Texto descriptivo de la sección..." />
                            </div>

                            {sectionType !== 'CAROUSEL' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Imagen Principal</label>
                                    <input type="file" ref={mainImageRef} accept="image/*" onChange={e => setMainImage(e.target.files?.[0] || null)} />
                                </div>
                            )}

                            {sectionType === 'CAROUSEL' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Imágenes del Carrusel (Múltiples)</label>
                                    <input type="file" ref={carouselImagesRef} accept="image/*" multiple onChange={e => setCarouselImages(Array.from(e.target.files || []))} />
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                Mostrar en la web pública
                            </label>

                            <button className="btn-primary" onClick={handleSave} disabled={isLoading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                                {isLoading ? 'Guardando...' : <><Save size={18} /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
