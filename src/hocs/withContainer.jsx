import React from 'react';

// Этот HOC добавляет функциональность контейнера:
// 1. Отображает специальную дроп-зону, если контейнер пуст.
// 2. В противном случае просто рендерит дочерние элементы.
// Он полностью скрывает от разработчика блока необходимость работать с dropRef и isOver.

export const withContainer = (WrappedComponent, styles) => {
    const ContainerWrapper = (props) => {
        const {
            block,
            children,
            mode,
            dropRef, // Принимаем, но не передаем дальше
            isOver,  // Принимаем, но не передаем дальше
            ...rest
        } = props;

        const isEditMode = mode === 'edit';
        const hasChildren = React.Children.count(children) > 0;

        // Если мы в режиме редактирования и детей нет, показываем дроп-зону.
        if (isEditMode && !hasChildren) {
            // Мы рендерим сам оборачиваемый компонент (например, <ContainerBlock>),
            // чтобы сохранить его тег и стили, а внутрь кладем дроп-зону.
            return (
                <WrappedComponent {...props}>
                    <div ref={dropRef} className={`${styles.emptyDropZone} ${isOver ? styles.isOver : ''}`}>
                        Перетащите блок сюда
                    </div>
                </WrappedComponent>
            );
        }

        // Если дети есть или мы в режиме просмотра, просто рендерим компонент с его детьми.
        return <WrappedComponent {...props}>{children}</WrappedComponent>;
    };

    ContainerWrapper.blockInfo = WrappedComponent.blockInfo;

    ContainerWrapper.displayName = `WithContainer(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    
    return ContainerWrapper;
};
