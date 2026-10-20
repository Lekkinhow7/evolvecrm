import React, { useId, useState } from 'react';
import { X } from 'lucide-react';
import { Contact } from '@/types';
import { DebugFillButton } from '@/components/debug/DebugFillButton';
import { fakeContact } from '@/lib/debug';
import { FocusTrap, useFocusReturn } from '@/lib/a11y';

import { Button } from '@/design-system';
import {
  FIELD_HINT_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  MODAL_BODY_CLASS,
  MODAL_CLOSE_BUTTON_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_BASE_CLASS,
  MODAL_TITLE_CLASS,
} from '@/components/ui/modalStyles';
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  companyName: string;
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: ContactFormData;
  setFormData: (data: ContactFormData) => void;
  editingContact: Contact | null;
  createFakeContactsBatch?: (count: number) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Componente React `ContactFormModal`.
 *
 * @param {ContactFormModalProps} {
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingContact,
} - Parâmetro `{
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingContact,
}`.
 * @returns {Element | null} Retorna um valor do tipo `Element | null`.
 */
export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingContact,
  createFakeContactsBatch,
  isSubmitting = false,
}) => {
  const headingId = useId();
  useFocusReturn({ enabled: isOpen });
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  
  if (!isOpen) return null;

  const fillWithFakeData = () => {
    const fake = fakeContact();
    setFormData({
      name: fake.name,
      email: fake.email,
      phone: fake.phone,
      role: fake.role,
      companyName: fake.companyName,
    });
  };

  return (
    <FocusTrap active={isOpen} onEscape={onClose}>
      <div 
        className={MODAL_OVERLAY_CLASS}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => {
          // Close only when clicking the backdrop (outside the panel).
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={`${MODAL_PANEL_BASE_CLASS} max-w-md animate-in zoom-in-95 duration-200`}>
          <div className={MODAL_HEADER_CLASS}>
            <div className="flex items-center gap-2">
              <h2 id={headingId} className={MODAL_TITLE_CLASS}>
                {editingContact ? 'Editar contato' : 'Novo contato'}
              </h2>
              <DebugFillButton onClick={fillWithFakeData} />
              {createFakeContactsBatch && (
                <DebugFillButton
                  onClick={async () => {
                    setIsCreatingBatch(true);
                    try {
                      await createFakeContactsBatch(10);
                      onClose();
                    } finally {
                      setIsCreatingBatch(false);
                    }
                  }}
                  label={isCreatingBatch ? 'Criando...' : 'Fake x10'}
                  variant="secondary"
                  className="ml-1"
                  disabled={isCreatingBatch}
                />
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar modal"
              className={MODAL_CLOSE_BUTTON_CLASS}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        <form onSubmit={onSubmit} className={`${MODAL_BODY_CLASS} space-y-4`}>
          <div>
            <label htmlFor="contact-name" className={FIELD_LABEL_CLASS}>
              Nome <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-name"
              required
              aria-required="true"
              type="text"
              className={FIELD_INPUT_CLASS}
              placeholder="Ex.: Maria da Silva"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className={FIELD_LABEL_CLASS}>
              E-mail
            </label>
            <input
              id="contact-email"
              type="email"
              className={FIELD_INPUT_CLASS}
              placeholder="maria@email.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className={FIELD_LABEL_CLASS}>
                Telefone
              </label>
              <input
                id="contact-phone"
                type="text"
                className={FIELD_INPUT_CLASS}
                placeholder="(71) 99999-9999"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="contact-role" className={FIELD_LABEL_CLASS}>Profissão</label>
              <input
                id="contact-role"
                type="text"
                className={FIELD_INPUT_CLASS}
                placeholder="Ex.: Professora"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-company" className={FIELD_LABEL_CLASS}>
              Empresa
            </label>
            <input
              id="contact-company"
              type="text"
              className={FIELD_INPUT_CLASS}
              placeholder="Opcional"
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
            />
            <p className={FIELD_HINT_CLASS}>
              {editingContact
                ? 'Edite para alterar a empresa. Deixe em branco para desvincular.'
                : 'Se a empresa já existir, o contato será vinculado a ela.'}
            </p>
          </div>

          <Button type="submit" block disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Salvando...' : (editingContact ? 'Salvar alterações' : 'Criar contato')}
          </Button>
        </form>
        </div>
      </div>
    </FocusTrap>
  );
};
