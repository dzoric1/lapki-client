import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { ColorInput } from './Modal/ColorInput';
import { Modal } from './Modal/Modal';
import { twMerge } from 'tailwind-merge';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { TextInput } from './Modal/TextInput';
import {
  Action,
  Condition as ConditionData,
  Event as StateEvent,
  Variable as VariableData,
} from '@renderer/types/diagram';
import { ReactComponent as AddIcon } from '@renderer/assets/icons/add.svg';
import { ReactComponent as SubtractIcon } from '@renderer/assets/icons/subtract.svg';
import { Select, SelectOption } from '@renderer/components/UI';
import { Condition } from '@renderer/lib/drawable/Condition';
import { State } from '@renderer/lib/drawable/State';
import { ArgumentProto } from '@renderer/types/platform';
import { operatorSet } from '@renderer/lib/data/PlatformManager';

type ArgSet = { [k: string]: string };
type ArgFormEntry = { name: string; description?: string };
type ArgForm = ArgFormEntry[];

interface FormPreset {
  compo: SelectOption;
  event: SelectOption;
  argSet: ArgSet;
  argForm: ArgForm;
}

// FIXME: пока только совместимое с Берлогой
interface ConditionPreset {
  operator: string;
  eventVar1: [SelectOption, SelectOption] | string | number;
  eventVar2: [SelectOption, SelectOption] | string | number;
}

interface CreateModalProps {
  isOpen: boolean;
  editor: CanvasEditor | null;
  isData: { state: State } | undefined;
  isTransition: { target: Condition } | undefined;
  isCondition: Action[] | undefined;
  setIsCondition: React.Dispatch<React.SetStateAction<Action[]>>;
  onOpenEventsModal: () => void;
  onClose: () => void;
  onSubmit: (data: CreateModalResult) => void;
}

export interface CreateModalFormValues {
  id: string;
  key: number;
  name: string;
  //Данные основного события
  triggerComponent: string;
  triggerMethod: string;

  argsOneElse: string;
  argsTwoElse: string;
  color: string;
}

export interface CreateModalResult {
  id: string;
  key: number;
  trigger: StateEvent;
  condition?: ConditionData;
  do: Action[];
  color?: string;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  onSubmit,
  onOpenEventsModal,
  onClose,
  isData,
  editor,
  ...props
}) => {
  const {
    register,
    reset: resetForm,
    setValue: setFormValue,
    formState: { errors },
    handleSubmit: hookHandleSubmit,
  } = useForm<CreateModalFormValues>();

  //--------------------------------Работа со списком компонентов---------------------------------------
  const machine = editor!.container.machine;

  const isEditingEvent = isData === undefined;

  const compoEntry = (idx: string) => {
    return {
      value: idx,
      label: (
        <div className="flex items-center">
          <img src={machine.platform.getComponentIconUrl(idx, true)} className="mr-1 h-7 w-7" />
          {idx}
        </div>
      ),
    };
  };

  const eventEntry = (name: string, compo?: string) => {
    return {
      value: name,
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getEventIconUrl(compo ?? components.value, name, true)}
            className="mr-1 h-7 w-7"
          />
          {name}
        </div>
      ),
    };
  };

  const actionEntry = (name: string, compo?: string) => {
    return {
      value: name,
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getActionIconUrl(compo ?? components.value, name, true)}
            className="mr-1 h-7 w-7"
          />
          {name}
        </div>
      ),
    };
  };

  const conditionEntry = (name: string, compo?: string) => {
    return {
      value: name,
      label: (
        <div className="flex items-center">
          <img
            src={machine.platform.getVariableIconUrl(
              compo ? param1Components.value : param2Components.value,
              name,
              true
            )}
            className="mr-1 h-7 w-7"
          />
          {name}
        </div>
      ),
    };
  };

  const sysCompoOption = !isEditingEvent ? [compoEntry('System')] : [];

  const optionsComponents = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const optionsParam1Components = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const optionsParam2Components = [
    ...sysCompoOption,
    ...Array.from(machine.components.entries()).map(([idx, _component]) => compoEntry(idx)),
  ];

  const [components, setComponents] = useState<SelectOption>(optionsComponents[0]);
  const [param1Components, setParam1Components] = useState<SelectOption>(
    optionsParam1Components[0]
  );
  const [param2Components, setParam2Components] = useState<SelectOption>(
    optionsParam2Components[0]
  );

  const optionsMethods = !components
    ? []
    : machine.platform.getAvailableEvents(components.value).map(({ name }) => eventEntry(name));

  const optionsParam1Methods = !components
    ? []
    : machine.platform
        .getAvailableVariables(param1Components.value)
        .map(({ name }) => conditionEntry(name, param1Components.value));

  const optionsParam2Methods = !components
    ? []
    : machine.platform
        .getAvailableVariables(param2Components.value)
        .map(({ name }) => conditionEntry(name, param2Components.value));

  const [methods, setMethods] = useState<SelectOption | null>(optionsMethods[0]);
  const [param1Methods, setParam1Methods] = useState<SelectOption | null>(optionsParam1Methods[0]);
  const [param2Methods, setParam2Methods] = useState<SelectOption | null>(optionsParam2Methods[0]);

  useEffect(() => {
    if (isChanged) return;
    if (optionsMethods.length > 0) {
      setMethods(optionsMethods[0]);
    } else {
      setMethods(null);
    }
  }, [components]);

  useEffect(() => {
    if (isChanged) return;
    if (optionsParam1Methods.length > 0) {
      setParam1Methods(optionsParam1Methods[0]);
    } else {
      setParam1Methods(null);
    }
  }, [param1Components]);

  useEffect(() => {
    if (isChanged) return;
    if (optionsParam2Methods.length > 0) {
      setParam2Methods(optionsParam2Methods[0]);
    } else {
      setParam2Methods(null);
    }
  }, [param2Components]);

  const [argSet, setArgSet] = useState<ArgSet>({});
  const [argForm, setArgForm] = useState<ArgForm>([]);

  const retrieveArgForm = (compo: string, method: string) => {
    const compoType = machine.platform.resolveComponent(compo);
    const component = machine.platform.data.components[compoType];
    if (!component) return [];

    const argList: ArgumentProto[] | undefined = isEditingEvent
      ? component.signals[method]?.parameters
      : component.methods[method]?.parameters;

    if (!argList) return [];
    const argForm: ArgForm = argList.map((arg) => {
      return { name: arg.name, description: arg.description };
    });
    return argForm;
  };

  useEffect(() => {
    if (!isChanged) return;
    setArgSet({});
    if (methods) {
      setArgForm(retrieveArgForm(components.value, methods.value));
    } else {
      setArgForm([]);
    }
  }, [methods]);

  const tryGetData: () => FormPreset | undefined = () => {
    if (isData) {
      const d = isData;
      if (d.state.eventBox.data.length >= 0) {
        const evs = d.state.eventBox.data[0];
        if (evs) {
          if (d.state.eventBox.data !== null) {
            const compoName = evs.trigger.component;
            const methodName = evs.trigger.method;
            return {
              compo: compoEntry(compoName),
              event: eventEntry(methodName, compoName),
              argSet: evs.trigger.args ?? {},
              argForm: retrieveArgForm(compoName, methodName),
            };
          } else {
            const ac = evs.trigger;
            if (ac) {
              const compoName = ac.component;
              const methodName = ac.method;
              const form = retrieveArgForm(compoName, methodName);
              return {
                compo: compoEntry(compoName),
                event: actionEntry(methodName, compoName),
                argSet: ac.args ?? {},
                argForm: form,
              };
            }
          }
        }
      }
    } else if (props.isTransition) {
      const d = props.isTransition.target.transition.data;
      const compoName = d.trigger.component;
      const methodName = d.trigger.method;
      return {
        compo: compoEntry(compoName),
        event: eventEntry(methodName, compoName),
        argSet: d.trigger.args ?? {},
        argForm: retrieveArgForm(compoName, methodName),
      };
    }
    return undefined;
  };

  const tryGetCondition: () => ConditionPreset | undefined = () => {
    if (props.isTransition) {
      const c = props.isTransition.target.transition.data.condition;
      if (!c) return undefined;
      const operator = c.type;
      if (!operatorSet.has(operator) || !Array.isArray(c.value) || c.value.length != 2) {
        console.warn('👽 got condition from future (not comparsion)', c);
        return undefined;
      }
      const param1 = c.value[0];
      const param2 = c.value[1];
      if (Array.isArray(param1.value) || Array.isArray(param2.value)) {
        console.warn('👽 got condition from future (non-value operands)', c);
        return undefined;
      }

      let eventVar1: [SelectOption, SelectOption] | string | number = '';
      let eventVar2: [SelectOption, SelectOption] | string | number = '';

      if (
        param1.type == 'value' &&
        (typeof param1.value === 'string' || typeof param1.value === 'number')
      ) {
        eventVar1 = param1.value;
      } else if (param1.type == 'component') {
        const compoName = (param1.value as VariableData).component;
        const methodName = (param1.value as VariableData).method;
        eventVar1 = [compoEntry(compoName), conditionEntry(methodName, compoName)];
      } else {
        console.warn('👽 got condition from future (strange operand 1)', c);
        return undefined;
      }

      if (
        param2.type == 'value' &&
        (typeof param2.value === 'string' || typeof param2.value === 'number')
      ) {
        eventVar2 = param2.value;
      } else if (param2.type == 'component') {
        const compoName = (param2.value as VariableData).component;
        const methodName = (param2.value as VariableData).method;
        eventVar2 = [compoEntry(compoName), conditionEntry(methodName, compoName)];
      } else {
        console.warn('👽 got condition from future (strange operand 2)', c);
        return undefined;
      }

      return {
        operator,
        eventVar1,
        eventVar2,
      };
    }
    return undefined;
  };

  const parameters = argForm.map((entry) => {
    const name = entry.name;
    const data = argSet[entry.name] ?? '';
    return (
      <>
        <label className="mx-1 flex flex-col">
          {name}
          <input
            className="w-[250px] max-w-[250px] rounded border bg-transparent px-2 py-1 outline-none transition-colors placeholder:font-normal"
            value={data}
            name={name}
            onChange={(e) => handleInputChange(e)}
          />
        </label>
      </>
    );
  });

  const handleInputChange = (e) => {
    const newSet = { ...argSet };
    newSet[e.target.name] = e.target.value;
    setArgSet(newSet);
  };

  const [isChanged, setIsChanged] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  useEffect(() => {
    if (!wasOpen && props.isOpen) {
      setIsChanged(false);
      const d: FormPreset | undefined = tryGetData();
      if (d) {
        setComponents(d.compo);
        setMethods(d.event);
        setArgSet(d.argSet);
        setArgForm(d.argForm);
      } else {
        setComponents(components);
      }
      const c: ConditionPreset | undefined = tryGetCondition();
      if (c) {
        setIsElse(false);
        setCondOperator(c.operator);
        if (typeof c.eventVar1 === 'string' || typeof c.eventVar1 === 'number') {
          setIsParamOne(false);
          setFormValue('argsOneElse', c.eventVar1.toString());
        } else {
          setIsParamOne(true);
          setParam1Components(c.eventVar1[0]);
          setParam1Methods(c.eventVar1[1]);
        }
        if (typeof c.eventVar2 === 'string' || typeof c.eventVar2 === 'number') {
          setIsParamTwo(false);
          setFormValue('argsTwoElse', c.eventVar2.toString());
        } else {
          setIsParamTwo(true);
          setParam2Components(c.eventVar2[0]);
          setParam2Methods(c.eventVar2[1]);
        }
      } else {
        setIsElse(true);
        resetForm();
      }
    }
    setWasOpen(props.isOpen);
  }, [props.isOpen]);

  //-----------------------------------------------------------------------------------------------------

  //-----------------------------Функция для закрытия модального окна-----------------------------------
  const onRequestClose = () => {
    onClose();
  };
  //-----------------------------------------------------------------------------------------------------

  //-------------------------------Реализация показа блоков условия--------------------------------------
  const [isElse, setIsElse] = useState(true);
  const [isParamOne, setIsParamOne] = useState(true);
  const [isParamTwo, setIsParamTwo] = useState(true);
  const handleIsElse = (event) => {
    if (event.target.checked) {
      setIsElse(false);
    } else {
      setIsElse(true);
    }
  };
  const handleParamOne = (event) => {
    if (event.target.checked) {
      setIsParamOne(false);
    } else {
      setIsParamOne(true);
    }
  };
  const handleParamTwo = (event) => {
    if (event.target.checked) {
      setIsParamTwo(false);
    } else {
      setIsParamTwo(true);
    }
  };
  //-----------------------------------------------------------------------------------------------------
  //Делаем проверку на наличие событий в состояниях
  const dataDo = isData?.state.eventBox.data.find(
    (value) =>
      components.value === value.trigger.component && methods?.value === value.trigger.method
  );
  useEffect(() => {
    if (!props.isTransition) {
      if (isData && dataDo) {
        props.setIsCondition(dataDo.do);
      } else {
        props.setIsCondition([]);
      }
    }
  }, [dataDo]);

  var method: Action[] = props.isCondition!;
  //-----------------------------Функция на нажатие кнопки "Сохранить"-----------------------------------
  const [condOperator, setCondOperator] = useState<string>();
  const handleSubmit = hookHandleSubmit((formData) => {
    if (!isElse) {
      if (isParamOne && param1Methods?.value == null) {
        return;
      }
      if (isParamTwo && param2Methods?.value == null) {
        return;
      }
    }
    if (methods?.value == null) {
      return;
    }

    const cond = isElse
      ? undefined
      : {
          type: condOperator!,
          value: [
            {
              type: isParamOne ? 'component' : 'value',
              value: isParamOne
                ? {
                    component: param1Components.value,
                    method: param1Methods!.value,
                    args: {},
                  }
                : formData.argsOneElse,
            },
            {
              type: isParamTwo ? 'component' : 'value',
              value: isParamTwo
                ? {
                    component: param2Components.value,
                    method: param2Methods!.value,
                    args: {},
                  }
                : formData.argsTwoElse,
            },
          ],
        };

    const data: CreateModalResult = {
      id: isData !== undefined ? isData.state.id! : '',
      key: isData ? 2 : 3,
      trigger: {
        component: components.value,
        method: methods.value,
      },
      condition: cond,
      do: method,
      color: formData.color,
    };

    onSubmit(data);
  });
  //-----------------------------------------------------------------------------------------------------

  const selectElse = [
    {
      type: 'greater',
      icon: '>',
    },
    {
      type: 'less',
      icon: '<',
    },
    {
      type: 'equals',
      icon: '=',
    },
    {
      type: 'notEquals',
      icon: '!=',
    },
    {
      type: 'greaterOrEqual',
      icon: '>=',
    },
    {
      type: 'lessOrEqual',
      icon: '<=',
    },
  ];
  //Срабатывания клика по элементу списка действий и удаление выбранного действия
  const [clickList, setClickList] = useState<number>(0);

  const deleteMethod = () => {
    const delMethod = method.filter((_value, index) => clickList !== index);
    props.setIsCondition(delMethod);
  };

  //Ниже реализовано перетаскивание событий между собой
  const [dragId, setDragId] = useState();
  const handleDrag = (id) => {
    setDragId(id);
    console.log(id);
  };

  const handleDrop = (id) => {
    const dragBox = method.find((_box, index) => index === dragId);
    const dropBox = method.find((_box, index) => index === id);

    const dragBoxOrder = dragBox;
    const dropBoxOrder = dropBox;

    const newBoxState = method.map((box, index) => {
      if (index === dragId) {
        box = dropBoxOrder!;
      }
      if (index === id) {
        box = dragBoxOrder!;
      }
      return box;
    });
    props.setIsCondition(newBoxState);
  };

  const onSelect = (fn) => (value) => {
    fn(value as SelectOption);
  };

  return (
    //--------------------------------------Показ модального окна------------------------------------------
    <Modal
      {...props}
      onRequestClose={onRequestClose}
      title={
        isData !== undefined
          ? 'Редактирование состояния: ' + JSON.stringify(isData?.state.data.name)
          : 'Редактор соединения'
      }
      onSubmit={handleSubmit}
      submitLabel="Сохранить"
    >
      {/*---------------------------------Добавление основного события-------------------------------------*/}
      <div className="flex items-center">
        <label className="mx-1">Когда: </label>
        <Select
          className="mx-1 my-1 mb-6 h-[34px] w-[200px] max-w-[200px]"
          options={optionsComponents}
          onChange={onSelect(setComponents)}
          value={components}
          isSearchable={false}
        />
        <Select
          className="mx-1 my-1 mb-6 h-[34px] w-[200px] max-w-[200px]"
          options={optionsMethods}
          onChange={onSelect(setMethods)}
          value={methods}
          isSearchable={false}
        />
        {isData &&
          (dataDo ? (
            <p className="text-success">Событие существует!</p>
          ) : (
            <p className="text-error">Событие отсутствует!</p>
          ))}
        {parameters?.length >= 0 ? <div className="mb-6">{parameters}</div> : ''}
      </div>

      {/*--------------------------------------Добавление условия------------------------------------------*/}
      {isData !== undefined || (
        <div className="flex items-start">
          <div className="my-3 flex items-center">
            <label className="mx-1">Если: </label>
            <label
              className={twMerge(
                'my-2 ml-3 select-none rounded bg-neutral-700 px-3 py-2 transition-colors hover:bg-neutral-500',
                !isElse && 'bg-neutral-500'
              )}
            >
              <input type="checkbox" onChange={handleIsElse} className="h-0 w-0 opacity-0" />
              <span>Условие</span>
            </label>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center">
              <input
                type="checkbox"
                onChange={handleParamOne}
                checked={!isParamOne}
                className={twMerge('mx-4', isElse && 'hidden')}
              />
              {isParamOne ? (
                <>
                  <Select
                    className={twMerge(
                      'mx-1 my-1 mb-6 h-[34px] w-[200px] max-w-[200px]',
                      isElse && 'hidden'
                    )}
                    options={optionsParam1Components}
                    onChange={onSelect(setParam1Components)}
                    value={param1Components}
                    isSearchable={false}
                  />
                  <Select
                    className={twMerge(
                      'mx-1 my-1 mb-6 h-[34px] w-[200px] max-w-[200px]',
                      isElse && 'hidden'
                    )}
                    options={optionsParam1Methods}
                    onChange={onSelect(setParam1Methods)}
                    value={param1Methods}
                    isSearchable={false}
                  />
                </>
              ) : (
                <TextInput
                  label="Параметр:"
                  placeholder="Напишите параметр"
                  {...register('argsOneElse', {
                    required: 'Это поле обязательно к заполнению!',
                  })}
                  isElse={isElse}
                  error={!!errors.argsOneElse}
                  errorMessage={errors.argsOneElse?.message ?? ''}
                />
              )}
            </div>
            <select
              className={twMerge(
                'mb-4 ml-8 w-[60px] rounded border bg-transparent px-1 py-1 text-white',
                isElse && 'hidden'
              )}
              ref={(event) => {
                if (event !== null) {
                  setCondOperator(event.value);
                }
              }}
            >
              {selectElse.map((content) => (
                <option
                  key={'option' + content.type}
                  className="bg-neutral-800"
                  value={content.type}
                  label={content.icon}
                ></option>
              ))}
            </select>
            <div className="flex items-center">
              <input
                type="checkbox"
                disabled={isElse}
                checked={!isParamTwo}
                onChange={handleParamTwo}
                className={twMerge('mx-4', isElse && 'hidden')}
              />
              {isParamTwo ? (
                <>
                  <Select
                    className={twMerge(
                      'mx-1 my-1 mb-6 h-[34px] w-[200px] max-w-[200px]',
                      isElse && 'hidden'
                    )}
                    options={optionsParam2Components}
                    onChange={onSelect(setParam2Components)}
                    value={param2Components}
                    isSearchable={false}
                  />
                  <Select
                    className={twMerge(
                      'mx-1 my-1 mb-6 h-[34px] w-[200px] max-w-[200px]',
                      isElse && 'hidden'
                    )}
                    options={optionsParam2Methods}
                    onChange={onSelect(setParam2Methods)}
                    value={param2Methods}
                    isSearchable={false}
                  />
                </>
              ) : (
                <TextInput
                  label="Параметр:"
                  placeholder="Напишите параметр"
                  {...register('argsTwoElse', {
                    required: 'Это поле обязательно к заполнению!',
                  })}
                  isElse={isElse}
                  error={!!errors.argsTwoElse}
                  errorMessage={errors.argsTwoElse?.message ?? ''}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/*-------------------------------------Добавление действий-----------------------------------------*/}
      <div className="flex">
        <label className="mx-1">Делай: </label>
        <div className="ml-1 mr-2 flex h-44 w-full flex-col overflow-y-auto break-words rounded bg-neutral-700 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#FFFFFF] scrollbar-thumb-rounded-full">
          {method === undefined ||
            method.map((data, key) => (
              <div
                key={'Methods' + key}
                className={twMerge('flex hover:bg-primary', clickList === key && 'bg-primary')}
                onClick={() => setClickList(key)}
                draggable={true}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => handleDrag(key)}
                onDrop={() => handleDrop(key)}
              >
                <div
                  className={twMerge(
                    'm-2 flex min-h-[3rem] w-36 items-center justify-around rounded-lg border-2 bg-neutral-700 px-1'
                  )}
                >
                  <img
                    style={{ height: '32px', width: '32px' }}
                    src={machine.platform.getComponentIconUrl(data.component, true)}
                  />
                  <div className="h-full border-2 border-white"></div>
                  <img
                    style={{ height: '32px', width: '32px' }}
                    src={machine.platform.getActionIconUrl(data.component, data.method, true)}
                  />
                </div>
                <div className="flex items-center">
                  <div>{data.component}.</div>
                  <div>{data.method}</div>
                </div>

                {data.args !== undefined || <div>{data.args}</div>}
              </div>
            ))}
        </div>
        <div className="flex flex-col">
          <button
            type="button"
            className="rounded bg-neutral-700 px-1 py-1 transition-colors hover:bg-neutral-600"
            onClick={onOpenEventsModal}
          >
            <AddIcon />
          </button>
          <button
            type="button"
            className="my-2 rounded bg-neutral-700 px-1 py-1 transition-colors hover:bg-neutral-600"
            onClick={deleteMethod}
          >
            <SubtractIcon />
          </button>
        </div>
      </div>

      {isData !== undefined || (
        <>
          <ColorInput
            label="Цвет связи:"
            {...register('color', { required: 'Это поле обязательно к заполнению!' })}
            error={!!errors.color}
            errorMessage={errors.color?.message ?? ''}
            defaultValue={props.isTransition?.target.transition.data.color}
          />
        </>
      )}
    </Modal>
  );
};
